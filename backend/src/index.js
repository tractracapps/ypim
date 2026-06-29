import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import applicationsRouter from './routes/applications.js';
import submitApplyRouter from './routes/submit-apply.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.resolve(__dirname, '../..');
const port = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(staticRoot));

app.get('/apply', (_req, res) => {
  res.redirect(301, '/Apply.html');
});

app.use('/api/applications', applicationsRouter);
app.use('/api/submit-apply', submitApplyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`YPiM backend listening on http://localhost:${port}`);
  console.log(`Static site: http://localhost:${port}/Apply.html`);
});
