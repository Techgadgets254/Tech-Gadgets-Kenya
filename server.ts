import dotenv from "dotenv";
dotenv.config();

import express from "express";
import app from "./api/index";
import path from "path";

const PORT = 3000;

// Vite middleware and static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  bootstrap().catch((err) => {
    console.error("Bootstrapping failed:", err);
  });
}

export default app;
