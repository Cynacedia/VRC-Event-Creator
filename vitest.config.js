// Vitest configuration. Pure-Node test environment by default — these tests
// exercise CommonJS modules under electron/core/ that have no DOM/Electron deps.

export default {
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    globals: false, // explicit imports keep things obvious
  },
};
