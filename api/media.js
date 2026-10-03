import { issueSignedToken, presignUrl } from '@vercel/blob';

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

    res.redirect(302, presignedUrl);
    return;
  } catch (error) {
    console.error('Private media signing failed:', error);
    res.status(500).send('Media unavailable');
  }
}
