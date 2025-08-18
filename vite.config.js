import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    https: {
      key: fs.readFileSync("./certs/key.pem"),
      cert: fs.readFileSync("./certs/cert.pem")
    }
  }
});
