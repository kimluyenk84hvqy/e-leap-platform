import QRCode from 'qrcode';

export default async function handler(req, res) {
  const text = String(req.query?.text || '').trim();
  if (!text || text.length > 2048) {
    return res.status(400).send('Invalid QR payload');
  }
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M'
    });
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).send(svg);
  } catch (error) {
    console.error('QR generation failed:', error);
    return res.status(500).send('QR generation failed');
  }
}
