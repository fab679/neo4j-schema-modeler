import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // When publishing to GitHub Pages under the repository URL
  // e.g. https://<user>.github.io/neo4j-schema-modeler/
  base: "/neo4j-schema-modeler/",
  plugins: [react(), tailwindcss()],
});
