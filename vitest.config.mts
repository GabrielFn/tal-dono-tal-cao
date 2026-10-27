import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // "server-only" lança erro fora do Next.js; nos testes, substituímos por um módulo vazio.
      "server-only": fileURLToPath(new URL("./tests/vazio.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
