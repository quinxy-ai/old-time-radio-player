import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { searchShow, getEpisodes } from './archiveOrg.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const stationsData = JSON.parse(
  readFileSync(join(__dir, '../data/stations.json'), 'utf8')
);

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'truly', 'from', 'this', 'that',
  'radio', 'show', 'program', 'theatre', 'theater', 'hour', 'time',
  'nbc', 'cbs', 'abc', 'bbc', 'otr', 'old', 'new',
]);

// Keep only episodes from the right show.
// First checks the archive identifier name — if it contains a show keyword the
// collection is show-specific and all episodes are trusted.
// Otherwise filters by episode title/filename with NO fallback: returning an
// empty array is better than returning the wrong show's content.
function filterByShow(episodes, showName, identifier = '') {
  const keywords = showName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  if (keywords.length === 0) return episodes;

  // If the identifier itself names this show, trust the whole collection
  const idNorm = identifier.toLowerCase().replace(/[-_]/g, ' ');
  if (keywords.some((kw) => idNorm.includes(kw))) return episodes;

  // Otherwise filter episode-by-episode — no fallback to unfiltered
  return episodes.filter((ep) => {
    const filename = ep.id.includes('/') ? ep.id.split('/').pop() : ep.id;
    const text = `${ep.title} ${filename}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

export function getStations() {
  return stationsData.stations.map((s) => ({
    id: s.id,
    type: s.type,
    name: s.name,
    frequency: s.frequency,
    shows: s.shows?.map((sh) => sh.name) ?? (s.show ? [s.show.name] : []),
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

  if (station.type === 'fixed') {
    return buildFixedQueue(station);
  }

  return [];
}

async function buildFixedQueue(station) {
  const show = station.show;
  if (!show) return [];
  try {
    let identifier;
    if (show.archiveId) {
      // Use hardcoded identifier — guaranteed to be the right show, no filtering needed
      identifier = show.archiveId;
      console.log(`[OTR] ${show.name} | using hardcoded archiveId: ${identifier}`);
    } else {
      const identifiers = await searchShow(show.searchQuery, 3);
      if (identifiers.length === 0) return [];
      identifier = identifiers[0];
      console.log(`[OTR] ${show.name} | search returned identifiers:`, identifiers);
    }
    const episodes = await getEpisodes(identifier);
    console.log(`[OTR] ${show.name} | episodes: ${episodes.length}`);
    // Only filter when we got the identifier from search (may be a compilation)
    const list = show.archiveId ? episodes : filterByShow(episodes, show.name);
    const sorted = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return sorted.map((ep) => ({ ...ep, showName: show.name }));
  } catch (err) {
    console.error(`Fixed queue: failed to load ${show.name}:`, err.message);
    return [];
  }
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
      const identifiers = await searchShow(show.searchQuery, 3);
      let found = [];
      for (const id of identifiers) {
        const episodes = await getEpisodes(id);
        found = filterByShow(episodes, show.name, id);
        if (found.length >= 5) break;
      }
      if (found.length > 0) {
        allEpisodes.push(...found.map((ep) => ({ ...ep, showName: show.name })));
      } else {
        console.warn(`[OTR] Genre: no matching episodes for ${show.name} — skipping`);
      }
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
      const identifiers = await searchShow(randomShow.searchQuery, 3);
      let filtered = [];
      for (const id of identifiers) {
        const episodes = await getEpisodes(id);
        filtered = filterByShow(episodes, randomShow.name, id);
        if (filtered.length >= 5) break;
      }
      const sampled = filtered
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
