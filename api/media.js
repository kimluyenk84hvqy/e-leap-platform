import { get } from '@vercel/blob';

export default async function handler(req, res) {
  const pathname = req.query?.pathname;

  if (!pathname || typeof pathname !== 'string') {
    res.status(400).send('Missing pathname');
    return;
  }

  // Only allow E-LEAP Objective First B2 lesson media.
  if (!pathname.startsWith('objective-first-b2/')) {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const result = await get(pathname, {
      access: 'private'
    });

    if (!result) {
      res.status(404).send('Media not found');
      return;
    }

    if (result.blob?.contentType) {
      res.setHeader('Content-Type', result.blob.contentType);
    }

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
