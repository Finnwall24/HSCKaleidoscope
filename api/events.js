export default function handler(req, res) {
  res.status(200).json({ ok: true, test: 'minimal function works' });
}
