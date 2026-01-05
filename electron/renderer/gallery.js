import { dom, state } from "./state.js";
import { showToast } from "./ui.js";
import { t } from "./i18n/index.js";

const PAGE_SIZE = 40;

let galleryApi = null;

function hasGalleryDom() {
  return dom.galleryOverlay && dom.galleryList;
}

function formatGalleryDate(value) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleDateString();
}

function setGalleryLoading(loading) {
  state.gallery.loading = loading;
  if (dom.galleryRefresh) {
    dom.galleryRefresh.disabled = loading;
  }
  if (dom.galleryUpload) {
    dom.galleryUpload.disabled = loading;
  }
  if (dom.galleryLoadMore) {
    dom.galleryLoadMore.disabled = loading;
  }
}

function updateGalleryFooter() {
  const selected = state.gallery.files.find(file => file.id === state.gallery.selectedId);
  if (dom.galleryUse) {
    dom.galleryUse.disabled = !selected;
  }
  if (dom.galleryLoadMore) {
    dom.galleryLoadMore.hidden = !state.gallery.hasMore;
  }
}

function sortGalleryFiles(files) {
  return files.slice().sort((a, b) => {
    const aTime = Date.parse(a?.createdAt || "") || 0;
    const bTime = Date.parse(b?.createdAt || "") || 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    const aLabel = String(a?.name || a?.id || "");
    const bLabel = String(b?.name || b?.id || "");
    return aLabel.localeCompare(bLabel);
  });
}

function renderGalleryList() {
  if (!dom.galleryList) {
    return;
  }
  dom.galleryList.innerHTML = "";
  const files = state.gallery.files;
  if (!files.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = state.gallery.loading ? t("gallery.loading") : t("gallery.empty");
    dom.galleryList.appendChild(empty);
    updateGalleryFooter();
    return;
  }
  files.forEach(file => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gallery-item";
    if (file.id === state.gallery.selectedId) {
      item.classList.add("is-selected");
    }
    item.dataset.id = file.id;

    const preview = document.createElement("div");
    preview.className = "gallery-preview";
    if (file.previewUrl && file.mimeType && file.mimeType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = file.previewUrl;
      img.alt = file.name || file.id;
      img.loading = "lazy";
      preview.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "gallery-placeholder";
      placeholder.textContent = (file.extension || "").replace(".", "").toUpperCase() || "IMG";
      preview.appendChild(placeholder);
    }

    const date = document.createElement("div");
    date.className = "gallery-date";
    date.textContent = formatGalleryDate(file.createdAt);

    item.appendChild(preview);
    if (date.textContent) {
      item.appendChild(date);
    }
    dom.galleryList.appendChild(item);
  });
  updateGalleryFooter();
}

function getGalleryUploadErrorMessage(error) {
  const code = error?.code;
  if (code === "GALLERY_LIMIT") {
    return t("gallery.uploadLimitReached");
  }
  if (code === "FILE_TOO_LARGE") {
    return t("gallery.uploadSizeError");
  }
  if (code === "FILE_TYPE" || code === "FILE_INVALID") {
    return t("gallery.uploadTypeError");
  }
  if (code === "DIMENSIONS_TOO_SMALL") {
    return t("gallery.uploadMinDimensions");
  }
  if (code === "DIMENSIONS_TOO_LARGE") {
    return t("gallery.uploadMaxDimensions");
  }
  return t("gallery.uploadFailed");
}

async function uploadGalleryImage() {
  if (!galleryApi?.uploadGalleryImage || !hasGalleryDom()) {
    showToast(t("gallery.uploadFailed"), true);
    return;
  }
  if (state.gallery.loading) {
    return;
  }
  setGalleryLoading(true);
  let result = null;
  try {
    result = await galleryApi.uploadGalleryImage();
  } catch (err) {
    showToast(t("gallery.uploadFailed"), true);
  } finally {
    setGalleryLoading(false);
  }

  if (!result || result.cancelled) {
    return;
  }
  if (!result.ok) {
    showToast(getGalleryUploadErrorMessage(result.error), true);
    return;
  }

  const uploadedId = result.data?.id || null;
  showToast(t("gallery.uploadSuccess"));
  await loadGalleryFiles({ reset: true });
  if (uploadedId) {
    state.gallery.selectedId = uploadedId;
    renderGalleryList();
  }
}

async function loadGalleryFiles(options = {}) {
  if (!galleryApi?.getGalleryFiles || !hasGalleryDom()) {
    showToast(t("gallery.loadFailed"), true);
    return;
  }
  if (state.gallery.loading) {
    return;
  }
  const reset = options.reset !== false;
  const offset = reset ? 0 : state.gallery.offset;
  if (reset) {
    state.gallery.files = [];
    state.gallery.offset = 0;
    state.gallery.hasMore = false;
    state.gallery.selectedId = null;
  }
  setGalleryLoading(true);
  renderGalleryList();
  try {
    const response = await galleryApi.getGalleryFiles({ offset, limit: PAGE_SIZE });
    const files = Array.isArray(response) ? response : [];
    const nextFiles = reset ? files : state.gallery.files.concat(files);
    state.gallery.files = sortGalleryFiles(nextFiles);
    state.gallery.offset = offset + files.length;
    state.gallery.hasMore = files.length >= PAGE_SIZE;
  } catch (err) {
    showToast(t("gallery.loadFailed"), true);
  } finally {
    setGalleryLoading(false);
    renderGalleryList();
  }
}

function closeGalleryPicker() {
  if (!dom.galleryOverlay) {
    return;
  }
  dom.galleryOverlay.classList.add("is-hidden");
  state.gallery.selectedId = null;
  state.gallery.targetInput = null;
}

function applyGallerySelection() {
  const selected = state.gallery.files.find(file => file.id === state.gallery.selectedId);
  if (!selected || !state.gallery.targetInput) {
    return;
  }
  state.gallery.targetInput.value = selected.id;
  closeGalleryPicker();
}

export function openGalleryPicker(targetInput) {
  if (!hasGalleryDom()) {
    return;
  }
  state.gallery.targetInput = targetInput;
  dom.galleryOverlay.classList.remove("is-hidden");
  void loadGalleryFiles({ reset: true });
}

export function initGalleryPicker(api) {
  if (api) {
    galleryApi = api;
  }
  if (!hasGalleryDom()) {
    return;
  }
  dom.galleryRefresh.addEventListener("click", () => void loadGalleryFiles({ reset: true }));
  if (dom.galleryUpload) {
    dom.galleryUpload.addEventListener("click", () => void uploadGalleryImage());
  }
  dom.galleryLoadMore.addEventListener("click", () => void loadGalleryFiles({ reset: false }));
  dom.galleryList.addEventListener("click", event => {
    const item = event.target.closest(".gallery-item");
    if (!item || !item.dataset.id) {
      return;
    }
    state.gallery.selectedId = item.dataset.id;
    renderGalleryList();
  });
  dom.galleryUse.addEventListener("click", applyGallerySelection);
  dom.galleryCancel.addEventListener("click", closeGalleryPicker);
  dom.galleryClose.addEventListener("click", closeGalleryPicker);
  dom.galleryOverlay.addEventListener("click", event => {
    if (event.target === dom.galleryOverlay) {
      closeGalleryPicker();
    }
  });
}
