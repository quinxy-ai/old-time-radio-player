const SEARCH_BASE = 'https://archive.org/advancedsearch.php';
const METADATA_BASE = 'https://archive.org/metadata';

// Strip duration tokens (29M37S, 1H02M, etc.), leading episode numbers,
// and long digit runs that indicate file-system metadata rather than a real title.
function cleanTitle(rawTitle, filename) {
  const base = rawTitle ?? filename.replace(/\.[^.]+$/, '');
  const cleaned = base
    .replace(/\b\d+[Hh]\d*[Mm]?\d*[Ss]?\b/g, '')  // 1H02M, 29M37S
    .replace(/\b\d+[Mm]\d*[Ss]?\b/g, '')             // 29M, 04M30S
    .replace(/\b\d+[Ss]\b/g, '')                      // 45S
    .replace(/^\s*\d+\)\s*/,'')                        // leading "4) "
    .replace(/\(\s*\)/g, '')                           // empty parens
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned.length >= 4 ? cleaned : filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

// In-memory cache: key -> { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function toCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Search archive.org for items matching a show query.
// Returns up to `limit` item identifiers, sorted by download count.
export async function searchShow(searchQuery, limit = 3) {
  const cacheKey = `search:${searchQuery}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const q = `mediatype:audio AND collection:oldtimeradio AND (${searchQuery})`;
  const params = new URLSearchParams({
    q,
    'fl[]': 'identifier,title,downloads,item_count',
    'sort[]': 'downloads desc',
    rows: String(limit * 3), // fetch extra so we can filter
    output: 'json',
  });

  const url = `${SEARCH_BASE}?${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Archive.org search failed: ${response.status}`);
  const data = await response.json();

  const docs = (data?.response?.docs ?? [])
    .filter((d) => d.identifier)
    .slice(0, limit)
    .map((d) => d.identifier);

  toCache(cacheKey, docs);
  return docs;
}

// Fetch audio episode list for a specific archive.org identifier.
// Returns array of { title, url, duration } objects.
export async function getEpisodes(identifier) {
  const cacheKey = `episodes:${identifier}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const url = `${METADATA_BASE}/${identifier}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Archive.org metadata failed: ${response.status}`);
  const data = await response.json();

  const AUDIO_FORMATS = new Set([
    'VBR MP3', '128Kbps MP3', '64Kbps MP3', '32Kbps MP3', 'MP3',
    'Ogg Vorbis', '128Kbps OGG', 'VBR OGG',
  ]);

  const episodes = (data.files ?? [])
    .filter((f) => AUDIO_FORMATS.has(f.format))
    .filter((f) => {
      const secs = parseFloat(f.length ?? '0');
      return secs > 300; // filter out clips shorter than 5 minutes
    })
    .map((f) => ({
      id: `${identifier}/${f.name}`,
      title: cleanTitle(f.title, f.name),
      url: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`,
      duration: parseFloat(f.length ?? '0'),
      archiveId: identifier,
    }));

  toCache(cacheKey, episodes);
  return episodes;
}
