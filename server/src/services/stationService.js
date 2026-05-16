import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { searchShow, getEpisodes } from './archiveOrg.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const stationsData = JSON.parse(
  readFileSync(join(__dir, '../data/stations.json'), 'utf8')
);

export function getStations() {
  return stationsData.stations.map((s) => ({
    id: s.id,
    type: s.type,
    name: s.name,
    frequency: s.frequency,
    // Include show names for display, omit raw search queries
    shows: s.shows?.map((sh) => sh.name) ?? [],
  }));
}

// Build an episode queue for a genre station by sampling from its shows.
// Picks up to `showsToSample` shows randomly, fetches their episodes from
// archive.org, then interleaves them for variety.
export async function getStationEpisodes(stationId) {
  const station = stationsData.stations.find((s) => s.id === stationId);
  if (!station) throw new Error(`Station not found: ${stationId}`);

  if (station.type === 'favorites') {
    // Favorites are managed client-side; server returns empty list.
    return [];
  }

  if (station.type === 'misc') {
    // Misc station: pull from multiple genres across all shows
    return buildMiscQueue(stationsData.stations);
  }

  if (station.type === 'genre') {
    return buildGenreQueue(station);
  }

  return [];
}

async function buildGenreQueue(station) {
  const shows = station.shows ?? [];
  if (shows.length === 0) return [];

  // Pick up to 3 shows at random to seed this listening session
  const shuffled = [...shows].sort(() => Math.random() - 0.5);
  const sampled = shuffled.slice(0, Math.min(3, shows.length));

  const allEpisodes = [];
  for (const show of sampled) {
    try {
      const identifiers = await searchShow(show.searchQuery, 1);
      if (identifiers.length === 0) continue;
      const episodes = await getEpisodes(identifiers[0]);
      // Tag each episode with its show name
      allEpisodes.push(
        ...episodes.map((ep) => ({ ...ep, showName: show.name }))
      );
    } catch (err) {
      console.error(`Failed to load ${show.name}:`, err.message);
    }
  }

  // Interleave episodes from different shows rather than playing one show at a time
  return interleave(allEpisodes, sampled.length);
}

async function buildMiscQueue(allStations) {
  const genreStations = allStations.filter((s) => s.type === 'genre');
  const allEpisodes = [];

  for (const station of genreStations) {
    const shows = station.shows ?? [];
    if (shows.length === 0) continue;
    const randomShow = shows[Math.floor(Math.random() * shows.length)];
    try {
      const identifiers = await searchShow(randomShow.searchQuery, 1);
      if (identifiers.length === 0) continue;
      const episodes = await getEpisodes(identifiers[0]);
      const sampled = episodes
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map((ep) => ({ ...ep, showName: randomShow.name }));
      allEpisodes.push(...sampled);
    } catch (err) {
      console.error(`Misc queue: failed to load ${randomShow.name}:`, err.message);
    }
  }

  return allEpisodes.sort(() => Math.random() - 0.5);
}

// Round-robin interleave: given a flat array of episodes tagged by show,
// pull one from each show in turn so genres alternate in the queue.
function interleave(episodes, groupCount) {
  if (groupCount <= 1) return episodes;
  const groups = [];
  for (let i = 0; i < groupCount; i++) groups.push([]);
  episodes.forEach((ep, idx) => groups[idx % groupCount].push(ep));

  const result = [];
  const maxLen = Math.max(...groups.map((g) => g.length));
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (i < group.length) result.push(group[i]);
    }
  }
  return result;
}
