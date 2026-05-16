import { Router } from 'express';
import { getStations, getStationEpisodes } from '../services/stationService.js';

export const stationsRouter = Router();

stationsRouter.get('/', (_req, res) => {
  try {
    res.json({ stations: getStations() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

stationsRouter.get('/:id/episodes', async (req, res) => {
  try {
    const episodes = await getStationEpisodes(req.params.id);
    res.json({ episodes });
  } catch (err) {
    if (err.message.startsWith('Station not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
