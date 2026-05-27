import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const releasesDir = path.resolve(process.cwd(), 'server/releases');

const platformKeywords: Record<string, string[]> = {
  windows: ['win', 'windows', '.exe'],
  linux: ['linux', '.rpm', '.deb'],
  arm: ['mac_arm', 'mac_arm64', 'darwin_arm', 'darwin_arm64'],
  intel: ['mac_intel', 'mac_x64', 'darwin_x64'],
};

function extractVersion(filename: string): string {
  const match = filename.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : '0.0.0';
}

function findLatestRelease(platform: string): string | null {
  if (!fs.existsSync(releasesDir)) return null;

  const keywords = platformKeywords[platform];
  if (!keywords) return null;

  const files = fs.readdirSync(releasesDir);
  const matched = files.filter(f =>
    keywords.some(kw => f.toLowerCase().includes(kw.toLowerCase()))
  );

  if (matched.length === 0) return null;

  matched.sort((a, b) => {
    const va = extractVersion(a);
    const vb = extractVersion(b);
    return vb.localeCompare(va, undefined, { numeric: true });
  });

  return matched[0];
}

const router = Router();

// Health check
router.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.COZE_PROJECT_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Get latest release info for a platform
router.get('/api/releases/latest', (req, res) => {
  const platform = (req.query.platform as string) || 'windows';

  const filename = findLatestRelease(platform);
  if (!filename) {
    res.status(404).json({ error: `No release found for platform: ${platform}` });
    return;
  }

  const filePath = path.join(releasesDir, filename);
  const stat = fs.statSync(filePath);

  res.json({
    platform,
    filename,
    version: extractVersion(filename),
    size: stat.size,
    downloadUrl: `/releases/${filename}`,
  });
});

// Download latest release for a platform
router.get('/api/releases/download', (req, res) => {
  const platform = (req.query.platform as string) || 'windows';

  const filename = findLatestRelease(platform);
  if (!filename) {
    res.status(404).json({ error: `No release found for platform: ${platform}` });
    return;
  }

  const filePath = path.join(releasesDir, filename);
  res.download(filePath, filename);
});

export default router;