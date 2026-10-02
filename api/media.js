import { get } from '@vercel/blob';

export default async function handler(request) {
  const pathname = request.query?.pathname;

  if (!pathname || typeof pathname !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing pathname' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Only allow E-LEAP Objective First B2 lesson media.
  if (!pathname.startsWith('objective-first-b2/')) {
    return new Response('Forbidden', { status: 403 });
  }

  const result = await get(pathname, { access: 'private' });

  if (!result || result.statusCode !== 200) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
}
