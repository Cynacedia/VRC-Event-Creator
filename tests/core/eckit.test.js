// Note: eckit.js uses a hardcoded production public key, so we can't generate
// a "valid signature accepted" test without holding the production private key
// (and we shouldn't). These tests cover every rejection path — which is the
// actual security surface for .eckit imports — plus the in-memory cache and
// fs-touching error paths.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  verifyKit,
  loadKits,
  importKit,
  hasKit,
  getKit,
  getKitGroupIds,
} from "../../electron/core/eckit.js";

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eckit-test-"));
  // Reset in-memory cache between tests by loading from an empty dir
  loadKits(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("verifyKit — rejection paths", () => {
  it("rejects null/undefined/non-object input", () => {
    expect(verifyKit(null)).toEqual({ valid: false, error: "Invalid kit format." });
    expect(verifyKit(undefined)).toEqual({ valid: false, error: "Invalid kit format." });
    expect(verifyKit("not an object")).toEqual({ valid: false, error: "Invalid kit format." });
    expect(verifyKit(42)).toEqual({ valid: false, error: "Invalid kit format." });
  });

  it("rejects when groupId is missing", () => {
    const result = verifyKit({ v: 1, sig: "abc", issuedTo: "x" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Missing groupId.");
  });

  it("rejects when signature is missing", () => {
    const result = verifyKit({ v: 1, groupId: "grp_123" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Missing signature.");
  });

  it("rejects an unsupported kit version", () => {
    const result = verifyKit({ v: 99, groupId: "grp_123", sig: "abc" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Unsupported kit version: 99");
  });

  it("rejects v=0 (must be exactly 1)", () => {
    const result = verifyKit({ v: 0, groupId: "grp_123", sig: "abc" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Unsupported kit version: 0");
  });

  it("rejects a tampered/forged signature with the production public key", () => {
    // A well-formed v1 kit with a structurally-valid base64 signature that
    // wasn't produced by the production private key. Verify should reject.
    const fakeSig = Buffer.alloc(64, 0x42).toString("base64"); // 64 bytes is the right Ed25519 size
    const result = verifyKit({
      v: 1,
      groupId: "grp_test",
      issuedTo: "tester",
      issuedAt: "2026-01-01T00:00:00Z",
      sig: fakeSig,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid signature.");
  });

  it("rejects a malformed signature buffer without throwing", () => {
    const result = verifyKit({
      v: 1,
      groupId: "grp_test",
      sig: "not-base64!!",
    });
    expect(result.valid).toBe(false);
    // Either invalid sig or verification-failed — both are correct rejections
    expect(result.error).toMatch(/Invalid signature\.|Verification failed:/);
  });
});

describe("loadKits — directory handling", () => {
  it("returns 0 when the directory is missing", () => {
    expect(loadKits(path.join(tmpDir, "does-not-exist"))).toBe(0);
  });

  it("returns 0 when the path is empty/null", () => {
    expect(loadKits("")).toBe(0);
    expect(loadKits(null)).toBe(0);
  });

  it("returns 0 when the directory has no .eckit files", () => {
    fs.writeFileSync(path.join(tmpDir, "readme.txt"), "ignore me");
    fs.writeFileSync(path.join(tmpDir, "config.json"), "{}");
    expect(loadKits(tmpDir)).toBe(0);
  });

  it("silently skips malformed .eckit files (invalid JSON)", () => {
    fs.writeFileSync(path.join(tmpDir, "junk.eckit"), "this is not json");
    expect(loadKits(tmpDir)).toBe(0);
    expect(hasKit("anything")).toBe(false);
  });

  it("silently skips .eckit files that fail signature verification", () => {
    const fakeSig = Buffer.alloc(64, 0x42).toString("base64");
    fs.writeFileSync(
      path.join(tmpDir, "tampered.eckit"),
      JSON.stringify({ v: 1, groupId: "grp_x", sig: fakeSig })
    );
    expect(loadKits(tmpDir)).toBe(0);
    expect(hasKit("grp_x")).toBe(false);
  });
});

describe("importKit — error paths", () => {
  it("returns ok:false when the source file doesn't exist", () => {
    const result = importKit(path.join(tmpDir, "missing.eckit"), tmpDir);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Failed to import kit/);
  });

  it("returns ok:false for malformed JSON", () => {
    const src = path.join(tmpDir, "bad.eckit");
    fs.writeFileSync(src, "{ not valid json");
    const result = importKit(src, tmpDir);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Failed to import kit/);
  });

  it("returns ok:false with the verifier's error for a tampered kit", () => {
    const src = path.join(tmpDir, "tampered.eckit");
    fs.writeFileSync(src, JSON.stringify({ v: 1, groupId: "grp_x", sig: "AA==" }));
    const result = importKit(src, tmpDir);
    expect(result.ok).toBe(false);
    // verifyKit returns one of these error messages
    expect(result.error).toMatch(/Invalid signature\.|Verification failed:/);
  });
});

describe("cache helpers (hasKit / getKit / getKitGroupIds)", () => {
  it("hasKit is false for unknown groups after loading an empty dir", () => {
    expect(hasKit("nope")).toBe(false);
    expect(getKit("nope")).toBeNull();
    expect(getKitGroupIds()).toEqual([]);
  });
});
