// Shared storage for Kaleidoscope's events (photos, tags, dates). Backed by
// Vercel KV, so every visitor to the site reads and writes the same data --
// there's no per-user account, so anyone with the site URL can see and add
// photos.
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await kv.get('events');
    res.status(200).json(data || []);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ error: 'Expected an array of events' });
      return;
    }

    // Safety net: refuse to silently replace real, existing data with an
    // empty list. In practice this only happens by accident -- a client
    // whose own initial load failed, still holding an empty in-memory list,
    // saving that over everyone's real photos. A deliberate "delete my last
    // event" from a client that loaded successfully passes confirmClear to
    // get past this on purpose.
    const confirmClear = req.query.confirmClear === 'true';
    if (body.length === 0 && !confirmClear) {
      const existing = await kv.get('events');
      if (Array.isArray(existing) && existing.length > 0) {
        res.status(409).json({ error: 'Refusing to overwrite existing non-empty data with an empty list. Pass ?confirmClear=true if this is intentional.' });
        return;
      }
    }

    await kv.set('events', body);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).send('Method not allowed');
}
