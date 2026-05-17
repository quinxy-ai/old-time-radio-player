import { create } from 'zustand';

const FREQ_MIN = 540;
const FREQ_MAX = 1600;
const SIGNAL_FULL_KHZ = 6;
const SIGNAL_ZERO_KHZ = 16;

const STORAGE_KEY_DIAL      = 'otr_dial_position';
const STORAGE_KEY_FAVORITES = 'otr_favorites';
const STORAGE_KEY_PROGRESS  = 'otr_station_progress';
const STORAGE_KEY_MODE      = 'otr_dial_mode';
const STORAGE_KEY_SCHEMA    = 'otr_schema_v';
const SCHEMA_VERSION        = 6; // bump to wipe corrupted station progress

function positionToFreq(pos) {
  return FREQ_MIN + pos * (FREQ_MAX - FREQ_MIN);
}

function freqToPosition(freq) {
  return (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN);
}

// Only stations appropriate for the current dial mode participate in signal calc
function getVisibleStations(allStations, dialMode) {
  return allStations.filter((s) => {
    if (s.type === 'favorites' || s.type === 'misc') return true;
    if (dialMode === 'genre') return s.type === 'genre';
    if (dialMode === 'fixed') return s.type === 'fixed';
    return false;
  });
}

// Approaching threshold — start pre-fetching at this signal strength
const APPROACHING_THRESHOLD = 0.20;

function calcSignal(frequency, stations) {
  let bestStrength = 0;
  let bestStation = null;

  for (const station of stations) {
    const dist = Math.abs(frequency - station.frequency);
    if (dist >= SIGNAL_ZERO_KHZ) continue;
    const strength =
      dist <= SIGNAL_FULL_KHZ
        ? 1
        : 1 - (dist - SIGNAL_FULL_KHZ) / (SIGNAL_ZERO_KHZ - SIGNAL_FULL_KHZ);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestStation = station;
    }
  }

  return {
    strength:          bestStrength,
    station:           bestStrength > 0.5              ? bestStation : null,
    approachingStation: bestStrength > APPROACHING_THRESHOLD ? bestStation : null,
  };
}

function loadPersistedState() {
  try {
    // Clear corrupted station progress from schema versions before episode-queue fix
    const schemaVersion = parseInt(localStorage.getItem(STORAGE_KEY_SCHEMA) ?? '1');
    if (schemaVersion < SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      localStorage.setItem(STORAGE_KEY_SCHEMA, String(SCHEMA_VERSION));
    }
    return {
      dialPosition:    parseFloat(localStorage.getItem(STORAGE_KEY_DIAL) ?? '0.5'),
      favorites:       JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) ?? '[]'),
      stationProgress: JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) ?? '{}'),
      dialMode:        localStorage.getItem(STORAGE_KEY_MODE) ?? 'genre',
    };
  } catch {
    return { dialPosition: 0.5, favorites: [], stationProgress: {}, dialMode: 'genre' };
  }
}

const persisted = loadPersistedState();

export const useRadioStore = create((set, get) => ({
  // --- Dial & tuning ---
  dialPosition:       persisted.dialPosition,
  frequency:          Math.round(positionToFreq(persisted.dialPosition)),
  stations:           [],
  currentStation:     null,
  approachingStation: null,
  signalStrength:     0,
  dialMode:           persisted.dialMode,

  // --- Playback ---
  episodeQueue:      [],
  episodeIndex:      0,
  currentEpisode:    null,
  isPlaying:         false,
  isLoadingEpisodes: false,
  isBuffering:       false,

  // --- User controls ---
  volume:          0.7,
  favorites:       persisted.favorites,
  stationProgress: persisted.stationProgress,

  // --- Actions ---

  setStations(stations) {
    const { dialPosition, dialMode } = get();
    const frequency = Math.round(positionToFreq(dialPosition));
    const visible = getVisibleStations(stations, dialMode);
    const { strength, station, approachingStation } = calcSignal(frequency, visible);
    set({ stations, frequency, signalStrength: strength, currentStation: station, approachingStation });
  },

  setDialPosition(pos) {
    const clamped = Math.max(0, Math.min(1, pos));
    const frequency = Math.round(positionToFreq(clamped));
    const { stations, dialMode } = get();
    const visible = getVisibleStations(stations, dialMode);
    const { strength, station, approachingStation } = calcSignal(frequency, visible);
    localStorage.setItem(STORAGE_KEY_DIAL, String(clamped));
    set({ dialPosition: clamped, frequency, signalStrength: strength, currentStation: station, approachingStation });
  },

  nudgeDialPosition(delta) {
    get().setDialPosition(get().dialPosition + delta);
  },

  toggleDialMode() {
    const { dialMode, stations, dialPosition } = get();
    const newMode = dialMode === 'genre' ? 'fixed' : 'genre';
    const frequency = Math.round(positionToFreq(dialPosition));
    const visible = getVisibleStations(stations, newMode);
    const { strength, station, approachingStation } = calcSignal(frequency, visible);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    set({ dialMode: newMode, signalStrength: strength, currentStation: station, approachingStation });
  },

  setEpisodeQueue(queue, startIndex = 0) {
    const episode = queue[startIndex] ?? null;
    set({ episodeQueue: queue, episodeIndex: startIndex, currentEpisode: episode });
  },

  setIsLoadingEpisodes(loading) { set({ isLoadingEpisodes: loading }); },
  setIsPlaying(playing)         { set({ isPlaying: playing }); },
  setIsBuffering(buffering)     { set({ isBuffering: buffering }); },
  setVolume(vol)                { set({ volume: Math.max(0, Math.min(1, vol)) }); },

  saveStationProgress(stationId, episodeId, showName) {
    if (!episodeId) return;
    const { stationProgress } = get();
    const updated = { ...stationProgress, [stationId]: { episodeId, showName } };
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
    } catch {
      // Quota exceeded — clear all progress and try again with just this entry
      try {
        const fresh = { [stationId]: { episodeId, showName } };
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(fresh));
        set({ stationProgress: fresh });
        return;
      } catch { return; }
    }
    set({ stationProgress: updated });
  },

  getSavedProgress(stationId, expectedShowName) {
    const { stationProgress } = get();
    const saved = stationProgress[stationId];
    if (!saved || !saved.episodeId) return null;
    if (expectedShowName && saved.showName && saved.showName !== expectedShowName) return null;
    return saved;
  },

  skipNext() {
    const { episodeQueue, episodeIndex, currentStation } = get();
    if (!episodeQueue.length) return;
    const nextIndex = (episodeIndex + 1) % episodeQueue.length;
    const episode = episodeQueue[nextIndex];
    if (currentStation && (currentStation.type === 'genre' || currentStation.type === 'fixed')) {
      get().saveStationProgress(currentStation.id, episode.id, episode.showName);
    }
    set({ episodeIndex: nextIndex, currentEpisode: episode });
  },

  skipPrev() {
    const { episodeQueue, episodeIndex, currentStation } = get();
    if (!episodeQueue.length) return;
    const prevIndex = episodeIndex <= 0 ? episodeQueue.length - 1 : episodeIndex - 1;
    const episode = episodeQueue[prevIndex];
    if (currentStation && currentStation.type === 'fixed') {
      get().saveStationProgress(currentStation.id, episode.id, episode.showName);
    }
    set({ episodeIndex: prevIndex, currentEpisode: episode });
  },

  toggleFavorite() {
    const { currentEpisode, favorites } = get();
    if (!currentEpisode) return;
    const exists = favorites.some((f) => f.id === currentEpisode.id);
    const updated = exists
      ? favorites.filter((f) => f.id !== currentEpisode.id)
      : [...favorites, currentEpisode];
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
    set({ favorites: updated });
  },

  isCurrentFavorite() {
    const { currentEpisode, favorites } = get();
    if (!currentEpisode) return false;
    return favorites.some((f) => f.id === currentEpisode.id);
  },
}));

export { positionToFreq, freqToPosition };
