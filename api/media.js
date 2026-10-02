import { issueSignedToken, presignUrl } from '@vercel/blob';

export default async function handler(request) {
  const pathname = request.query?.pathname;

  if (!pathname || typeof pathname !== 'string') {
    return new Response('Missing pathname', { status: 400 });
  }

  // Only allow E-LEAP Objective First B2 lesson media.
  if (!pathname.startsWith('objective-first-b2/')) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const token = await issueSignedToken({
      pathname,
      operations: ['get'],
      validUntil: Date.now() + 10 * 60 * 1000
    });

    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: 'get',
      validUntil: Date.now() + 5 * 60 * 1000
    });

    return Response.redirect(presignedUrl, 302);
  } catch (error) {
    console.error('Private media signing failed:', error);
    return new Response('Media unavailable', { status: 500 });
  }
}
