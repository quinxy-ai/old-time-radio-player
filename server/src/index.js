import express from 'express';
import cors from 'cors';
import { stationsRouter } from './routes/stations.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stations', stationsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`OTR server listening on http://localhost:${PORT}`);
});
