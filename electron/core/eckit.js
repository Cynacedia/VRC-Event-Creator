/**
 * EC Kit (Event Creator Kit) — webhook identity license verification.
 * Uses Ed25519 signatures for offline verification of .eckit license files.
 * No external dependencies — uses Node.js built-in crypto module.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Public key for verifying kit signatures (DER/SPKI hex-encoded)
const PUBLIC_KEY_HEX = "302a300506032b65700321000a79f357684ccc294dac248fbf19135f7551c5d7bd1b9568a8eb239219636a99";

let publicKey;
try {
  publicKey = crypto.createPublicKey({
    key: Buffer.from(PUBLIC_KEY_HEX, "hex"),
    format: "der",
    type: "spki"
  });
} catch (err) {
  console.error("Failed to load EC Kit public key:", err.message);
}

// In-memory cache of verified kits, keyed by groupId
const verifiedKits = new Map();

/**
 * Build the canonical payload string for signing/verification.
 * Fields are sorted alphabetically and joined with newlines.
 */
function canonicalize(kit) {
  const fields = {
    groupId: kit.groupId || "",
    issuedAt: kit.issuedAt || "",
    issuedTo: kit.issuedTo || "",
    v: String(kit.v || 1)
  };
  return Object.keys(fields).sort().map(k => `${k}:${fields[k]}`).join("\n");
}

/**
 * Verify an .eckit file's signature.
 * @param {object} kit - Parsed kit JSON
 * @returns {{ valid: boolean, error?: string }}
 */
function verifyKit(kit) {
  if (!publicKey) return { valid: false, error: "Public key not loaded." };
  if (!kit || typeof kit !== "object") return { valid: false, error: "Invalid kit format." };
  if (!kit.groupId) return { valid: false, error: "Missing groupId." };
  if (!kit.sig) return { valid: false, error: "Missing signature." };
  if (kit.v !== 1) return { valid: false, error: `Unsupported kit version: ${kit.v}` };

  try {
    const payload = canonicalize(kit);
    const signature = Buffer.from(kit.sig, "base64");
    const isValid = crypto.verify(null, Buffer.from(payload, "utf8"), publicKey, signature);
    if (!isValid) return { valid: false, error: "Invalid signature." };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Verification failed: ${err.message}` };
  }
}

/**
 * Load and verify all .eckit files from a directory.
 * @param {string} kitsDir - Path to the kits directory
 * @returns {number} Number of valid kits loaded
 */
function loadKits(kitsDir) {
  verifiedKits.clear();
  if (!kitsDir || !fs.existsSync(kitsDir)) return 0;

  let count = 0;
  try {
    const files = fs.readdirSync(kitsDir).filter(f => f.endsWith(".eckit"));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(kitsDir, file), "utf8");
        const kit = JSON.parse(raw);
        const result = verifyKit(kit);
        if (result.valid && kit.groupId) {
          verifiedKits.set(kit.groupId, {
            groupId: kit.groupId,
            issuedTo: kit.issuedTo || "",
            issuedAt: kit.issuedAt || "",
            filename: file
          });
          count++;
        }
      } catch {
        // Skip invalid files silently
      }
    }
  } catch {
    // Directory read error
  }
  return count;
}

/**
 * Import an .eckit file — verify and copy to kits directory.
 * @param {string} filePath - Path to the .eckit file to import
 * @param {string} kitsDir - Path to the kits directory
 * @returns {{ ok: boolean, groupId?: string, issuedTo?: string, error?: string }}
 */
function importKit(filePath, kitsDir) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const kit = JSON.parse(raw);
    const result = verifyKit(kit);
    if (!result.valid) return { ok: false, error: result.error };

    // Ensure kits directory exists
    fs.mkdirSync(kitsDir, { recursive: true });

    // Copy to kits directory
    const destName = `${kit.groupId}.eckit`;
    fs.copyFileSync(filePath, path.join(kitsDir, destName));

    // Add to cache
    verifiedKits.set(kit.groupId, {
      groupId: kit.groupId,
      issuedTo: kit.issuedTo || "",
      issuedAt: kit.issuedAt || "",
      filename: destName
    });

    return { ok: true, groupId: kit.groupId, issuedTo: kit.issuedTo || "" };
  } catch (err) {
    return { ok: false, error: `Failed to import kit: ${err.message}` };
  }
}

/**
 * Check if a group has a valid kit loaded.
 * @param {string} groupId
 * @returns {boolean}
 */
function hasKit(groupId) {
  return verifiedKits.has(groupId);
}

/**
 * Get kit info for a group.
 * @param {string} groupId
 * @returns {{ groupId: string, issuedTo: string, issuedAt: string } | null}
 */
function getKit(groupId) {
  return verifiedKits.get(groupId) || null;
}

/**
 * Get all loaded kit group IDs.
 * @returns {string[]}
 */
function getKitGroupIds() {
  return Array.from(verifiedKits.keys());
}

module.exports = {
  loadKits,
  importKit,
  verifyKit,
  hasKit,
  getKit,
  getKitGroupIds
};
