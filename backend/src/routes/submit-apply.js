import { Router } from 'express';
import { persistApplication } from '../services/persistApplication.js';
import { sendApplicationEmail } from '../lib/sendApplicationEmail.js';
import { normalizeSubmitPayload } from '../lib/normalizeApplication.js';

const router = Router();

router.post('/', async (req, res) => {
  const normalized = normalizeSubmitPayload(req.body);
  const result = await persistApplication(normalized);

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, details: result.details });
  }

  const emailResult = await sendApplicationEmail(normalized);
  if (!emailResult.sent) {
    console.warn('Application saved but email not sent:', emailResult.reason);
  }

  return res.status(200).json({
    ok: true,
    id: result.id,
    created_at: result.created_at,
    email_sent: emailResult.sent,
  });
});

export default router;
