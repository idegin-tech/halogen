import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/lib/index.ts", "src/types/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  clean: true,
});