import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test-src/**/*.test.jsx"],
    setupFiles: ["test-src/setup.js"],
  },
});
