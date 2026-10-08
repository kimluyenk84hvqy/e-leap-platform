import { get } from '@vercel/blob';

const ALLOWED_PREFIXES = [
  'objective-first-b2/',
  'life-intermediate/',
  'advanced-skills/',
  'medical-english/',
  'english-for-pharmacy/'
];

export default async function handler(req, res) {
  const pathname = req.query?.pathname;

  if (!pathname || typeof pathname !== 'string') {
    res.status(400).send('Missing pathname');
    return;
  }

  const normalized = pathname.replace(/^\/+/, '');
  const allowed = ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix));
  if (!allowed || normalized.includes('..')) {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const result = await get(normalized, { access: 'private' });

    if (!result) {
      res.status(404).send('Media not found');
      return;
    }

    if (result.blob?.contentType) {
      res.setHeader('Content-Type', result.blob.contentType);
    }

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const reader = result.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    console.error('Private Blob read failed:', error);
    res.status(500).send('Media unavailable');
  }
}
