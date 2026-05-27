import type { Application, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import viteConfig from '../vite.config';

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';

export async function setupViteMiddleware(app: Application) {
  // Serve release files for download
  const releasesPath = path.resolve(process.cwd(), 'server/releases');
  if (fs.existsSync(releasesPath)) {
    app.use('/releases', express.static(releasesPath));
  }

  const vite = await createViteServer({
    ...viteConfig,
    server: {
      ...viteConfig.server,
      middlewareMode: true,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);
  console.log('🚀 Vite dev server initialized');
}

export function setupStaticServer(app: Application) {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }

  // Serve release files for download
  const releasesPath = path.resolve(process.cwd(), 'server/releases');
  if (fs.existsSync(releasesPath)) {
    app.use('/releases', express.static(releasesPath));
  }

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('📦 Serving static files from dist/');
}

export async function setupVite(app: Application) {
  if (isDev) {
    await setupViteMiddleware(app);
  } else {
    setupStaticServer(app);
  }
}