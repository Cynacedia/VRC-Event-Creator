// Vitest configuration. Pure-Node test environment by default — these tests
// exercise CommonJS modules under electron/core/ that have no DOM/Electron deps.
//
// Tests live under `.dev/tests/` (gitignored) — they're internal dev tooling,
// not part of the shipped app. This config file IS committed so the test
// command + structure are documented; running `npm test` on a fresh clone
// will simply find no tests, which is intentional.

export default {
  test: {
    include: [".dev/tests/**/*.test.js"],
    environment: "node",
    globals: false, // explicit imports keep things obvious
  },
};
