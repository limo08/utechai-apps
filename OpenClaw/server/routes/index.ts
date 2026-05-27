import { Router } from 'express';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import fs from 'fs';
import path from 'path';

const releasesDir = path.resolve(process.cwd(), 'server/releases');

// Platform keywords for matching release files
const platformKeywords: Record<string, string[]> = {
  windows: ['win', 'windows', '.exe'],
  linux: ['linux', '.rpm', '.deb'],
  arm: ['mac_arm', 'mac_arm64', 'darwin_arm', 'darwin_arm64'],
  intel: ['mac_intel', 'mac_x64', 'darwin_x64'],
};

// Extract version number from filename for sorting
function extractVersion(filename: string): string {
  const match = filename.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : '0.0.0';
}

// Find the latest release file for a given platform
function findLatestRelease(platform: string): string | null {
  if (!fs.existsSync(releasesDir)) return null;

  const keywords = platformKeywords[platform];
  if (!keywords) return null;

  const files = fs.readdirSync(releasesDir);
  const matched = files.filter(f =>
    keywords.some(kw => f.toLowerCase().includes(kw.toLowerCase()))
  );

  if (matched.length === 0) return null;

  // Sort by version descending, pick the latest
  matched.sort((a, b) => {
    const va = extractVersion(a);
    const vb = extractVersion(b);
    return vb.localeCompare(va, undefined, { numeric: true });
  });

  return matched[0];
}

const router = Router();

// Fetch URL content
router.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid url parameter' });
      return;
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new FetchClient(config, customHeaders);
    const response = await client.fetch(url);

    if (response.status_code !== 0) {
      res.status(500).json({ error: response.status_message || 'Fetch failed' });
      return;
    }

    res.json({
      title: response.title,
      url: response.url,
      content: response.content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
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

// Redirect to latest release download for a platform
router.get('/api/releases/download', (req, res) => {
  const platform = (req.query.platform as string) || 'windows';

  const filename = findLatestRelease(platform);
  if (!filename) {
    res.status(404).json({ error: `No release found for platform: ${platform}` });
    return;
  }

  res.redirect(`/releases/${filename}`);
});

// API 路由示例
router.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Express + Vite!',
    timestamp: new Date().toISOString(),
  });
});

router.post('/api/data', (req, res) => {
  const requestData = req.body;
  res.json({
    success: true,
    data: requestData,
    receivedAt: new Date().toISOString(),
  });
});

// 健康检查接口
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.COZE_PROJECT_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
