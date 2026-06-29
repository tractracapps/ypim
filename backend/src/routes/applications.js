import { Router } from 'express';
import { pool } from '../db.js';
import { persistApplication } from '../services/persistApplication.js';

const router = Router();

router.post('/', async (req, res) => {
  const result = await persistApplication(req.body);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, details: result.details });
  }

  return res.status(result.status).json({
    id: result.id,
    created_at: result.created_at,
    message: result.message,
  });
});

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false });
  }
});

export default router;
