import { put, list } from '@vercel/blob';

export default function handler(req, res) {
  res.status(200).json({ ok: true, test: 'import succeeded without calling it' });
}
