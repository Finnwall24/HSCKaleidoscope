// Shared storage for Kaleidoscope's events (photos, tags, dates). Backed by
// Vercel Blob, so every visitor to the site reads and writes the same data
// -- there's no per-user account, so anyone with the site URL can see and
// add photos. The whole events array is stored as one JSON file, always at
// the same path, so every save overwrites the previous one.
import { put, list } from '@vercel/blob';

const EVENTS_PATH = 'events.json';

async function readEvents() {
  const { blobs } = await list({ prefix: EVENTS_PATH, limit: 1 });
  if (!blobs.length) return [];
  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readEvents();
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ error: 'Expected an array of events' });
      return;
    }

    const confirmClear = req.query.confirmClear === 'true';
    if (body.length === 0 && !confirmClear) {
      const existing = await readEvents();
      if (existing.length > 0) {
        res.status(409).json({ error: 'Refusing to overwrite existing non-empty data with an empty list. Pass ?confirmClear=true if this is intentional.' });
        return;
      }
    }

    await put(EVENTS_PATH, JSON.stringify(body), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).send('Method not allowed');
}
