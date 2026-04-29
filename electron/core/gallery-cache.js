const fs = require("fs");
const path = require("path");

let CACHE_DIR, MANIFEST_PATH;
let getVrchat; // function that returns the vrchat SDK instance
let log; // debug log function

function init(config) {
  CACHE_DIR = config.cacheDir;
  MANIFEST_PATH = config.manifestPath;
  getVrchat = config.getVrchat;
  log = config.debugLog || (() => {});
}

function ensureGalleryCacheDir() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    log("galleryCache", "Failed to create cache directory:", err.message);
  }
}

function loadGalleryCacheManifest() {
  try {
    const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    if (raw.version !== 1) return { version: 1, images: {} };
    return raw;
  } catch {
    return { version: 1, images: {} };
  }
}

function saveGalleryCacheManifest(manifest) {
  try {
    ensureGalleryCacheDir();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  } catch (err) {
    log("galleryCache", "Failed to save manifest:", err.message);
  }
}

async function downloadGalleryImage(imageId, _remoteUrl, mimeType) {
  try {
    ensureGalleryCacheDir();
    const ext = mimeType === "image/png" ? ".png" : ".jpg";
    const localFileName = `${imageId}${ext}`;
    const localPath = path.join(CACHE_DIR, localFileName);

    // Validate that the resolved path is within the cache directory (prevent path traversal)
    const normalizedPath = path.normalize(localPath);
    const normalizedCacheDir = path.normalize(CACHE_DIR);
    if (!normalizedPath.startsWith(normalizedCacheDir)) {
      log("galleryCache", `Invalid path detected for ${imageId}`);
      return null;
    }

    const vrchat = getVrchat();

    // Use SDK's authenticated downloadFileVersion method
    // First get file info to determine version
    const fileRes = await vrchat.getFile({
      path: { fileId: imageId },
      throwOnError: false
    });
    const file = fileRes?.data;
    if (!file || !file.versions?.length) {
      log("galleryCache", `No file data or versions for ${imageId}`);
      return null;
    }

    const lastVersion = file.versions[file.versions.length - 1];
    const versionNum = lastVersion?.version ?? 1;

    log("galleryCache", `Downloading ${imageId} version ${versionNum} via SDK`);

    const downloadRes = await vrchat.downloadFileVersion({
      path: { fileId: imageId, versionId: versionNum },
      throwOnError: false
    });

    const blob = downloadRes?.data;
    if (!blob) {
      log("galleryCache", `Failed to download ${imageId}: no blob data`);
      return null;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_IMAGE_SIZE) {
      log("galleryCache", `Downloaded image too large for ${imageId}: ${buffer.length} bytes`);
      return null;
    }

    // Verify buffer contains valid image data by checking magic bytes
    const isValidImage =
      (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
      (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) || // JPEG
      (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50); // WebP

    if (!isValidImage) {
      log("galleryCache", `Invalid image data for ${imageId}`);
      return null;
    }

    fs.writeFileSync(localPath, buffer);

    const manifest = loadGalleryCacheManifest();
    manifest.images[imageId] = {
      localPath: localFileName,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
      size: buffer.length,
      mimeType
    };
    saveGalleryCacheManifest(manifest);

    log("galleryCache", `Cached image: ${imageId} (${buffer.length} bytes)`);
    return localFileName;
  } catch (err) {
    log("galleryCache", `Error caching ${imageId}:`, err.message);
    return null;
  }
}

function getCachedImageAsDataUrl(imageId) {
  try {
    const manifest = loadGalleryCacheManifest();
    const entry = manifest.images[imageId];
    if (!entry) return null;

    const localPath = path.join(CACHE_DIR, entry.localPath);
    if (!fs.existsSync(localPath)) {
      // File missing, remove from manifest
      delete manifest.images[imageId];
      saveGalleryCacheManifest(manifest);
      return null;
    }

    const buffer = fs.readFileSync(localPath);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${entry.mimeType};base64,${base64}`;

    // Update last accessed time
    entry.lastAccessed = Date.now();
    saveGalleryCacheManifest(manifest);

    return dataUrl;
  } catch (err) {
    log("galleryCache", `Error reading cached image ${imageId}:`, err.message);
    return null;
  }
}

function cleanGalleryCache(maxAgeDays = 30) {
  try {
    const manifest = loadGalleryCacheManifest();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let removed = 0;

    for (const [imageId, entry] of Object.entries(manifest.images)) {
      const age = now - (entry.lastAccessed || entry.cachedAt);
      if (age > maxAgeMs) {
        const localPath = path.join(CACHE_DIR, entry.localPath);
        try {
          fs.unlinkSync(localPath);
        } catch { /* ignore */ }
        delete manifest.images[imageId];
        removed++;
      }
    }

    if (removed > 0) {
      saveGalleryCacheManifest(manifest);
      log("galleryCache", `Cleaned ${removed} stale cache entries`);
    }
    return removed;
  } catch (err) {
    log("galleryCache", "Error cleaning cache:", err.message);
    return 0;
  }
}

function removeDeletedFromGalleryCache(currentImageIds) {
  try {
    const manifest = loadGalleryCacheManifest();
    const currentSet = new Set(currentImageIds);
    let removed = 0;

    for (const cachedId of Object.keys(manifest.images)) {
      if (!currentSet.has(cachedId)) {
        const entry = manifest.images[cachedId];
        const localPath = path.join(CACHE_DIR, entry.localPath);
        try {
          fs.unlinkSync(localPath);
        } catch { /* ignore */ }
        delete manifest.images[cachedId];
        removed++;
      }
    }

    if (removed > 0) {
      saveGalleryCacheManifest(manifest);
      log("galleryCache", `Removed ${removed} deleted images from cache`);
    }
    return removed;
  } catch (err) {
    log("galleryCache", "Error removing deleted images:", err.message);
    return 0;
  }
}

module.exports = {
  init,
  ensureGalleryCacheDir,
  loadGalleryCacheManifest,
  saveGalleryCacheManifest,
  downloadGalleryImage,
  getCachedImageAsDataUrl,
  cleanGalleryCache,
  removeDeletedFromGalleryCache
};
