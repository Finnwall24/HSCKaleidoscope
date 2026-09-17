// Uploads a single photo as its own file in Vercel Blob storage, returning
// its URL. Each photo is its own blob (rather than embedded as base64 text
// inside the shared events.json) so that document stays tiny forever, and
// so a single upload is never bundled into one giant request with every
// other photo already in the library -- which is what would eventually hit
// Vercel's ~4.5MB request size limit as the library grows.
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const { dataUrl } = req.body || {};
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Expected { dataUrl: "data:image/...;base64,..." }' });
    return;
  }
  const [, contentType, base64Data] = match;
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = contentType.split('/')[1] || 'jpg';
  const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  res.status(200).json({ url: blob.url });
}
