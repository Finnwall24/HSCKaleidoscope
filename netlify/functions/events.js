// Shared storage for Kaleidoscope's events (photos, tags, dates). Backed by
// Netlify Blobs, so every visitor to the site reads and writes the same
// data -- there's no per-user account, so anyone with the site URL can see
// and add photos.
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore('kaleidoscope');

  if (event.httpMethod === 'GET') {
    const data = await store.get('events', { type: 'json' });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || []),
    };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '[]');
    } catch (err) {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
    if (!Array.isArray(body)) {
      return { statusCode: 400, body: 'Expected an array of events' };
    }

    // Safety net: refuse to silently replace real, existing data with an
    // empty list. In practice this only happens by accident -- a client
    // whose own initial load failed, still holding an empty in-memory list,
    // saving that over everyone's real photos. A deliberate "delete my last
    // event" from a client that loaded successfully passes confirmClear to
    // get past this on purpose.
    const confirmClear = event.queryStringParameters && event.queryStringParameters.confirmClear === 'true';
    if (body.length === 0 && !confirmClear) {
      const existing = await store.get('events', { type: 'json' });
      if (Array.isArray(existing) && existing.length > 0) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Refusing to overwrite existing non-empty data with an empty list. Pass ?confirmClear=true if this is intentional.' }),
        };
      }
    }

    await store.setJSON('events', body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
