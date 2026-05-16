import { create } from 'zustand';

const FREQ_MIN = 540;
const FREQ_MAX = 1600;
const SIGNAL_FULL_KHZ = 6;   // ±kHz from center = 100% signal
const SIGNAL_ZERO_KHZ = 16;  // ±kHz from center = 0% signal

const STORAGE_KEY_DIAL = 'otr_dial_position';
const STORAGE_KEY_FAVORITES = 'otr_favorites';
const STORAGE_KEY_PROGRESS = 'otr_station_progress';

function positionToFreq(pos) {
  return FREQ_MIN + pos * (FREQ_MAX - FREQ_MIN);
}

function freqToPosition(freq) {
  return (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN);
}

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

  return { strength: bestStrength, station: bestStrength > 0.5 ? bestStation : null };
}

function loadPersistedState() {
  try {
    return {
      dialPosition: parseFloat(localStorage.getItem(STORAGE_KEY_DIAL) ?? '0.5'),
      favorites: JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) ?? '[]'),
      stationProgress: JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) ?? '{}'),
    };
  } catch {
    return { dialPosition: 0.5, favorites: [], stationProgress: {} };
  }
}

const persisted = loadPersistedState();

export const useRadioStore = create((set, get) => ({
  // --- Dial & tuning ---
  dialPosition: persisted.dialPosition,
  frequency: Math.round(positionToFreq(persisted.dialPosition)),
  stations: [],
  currentStation: null,
  signalStrength: 0,

  // --- Playback ---
  episodeQueue: [],
  episodeIndex: 0,
  currentEpisode: null,
  isPlaying: false,
  isLoadingEpisodes: false,

  // --- User controls ---
  volume: 0.7,
  favorites: persisted.favorites,
  stationProgress: persisted.stationProgress,

  // --- Actions ---

  setStations(stations) {
    const { dialPosition } = get();
    const frequency = Math.round(positionToFreq(dialPosition));
    const { strength, station } = calcSignal(frequency, stations);
    set({ stations, frequency, signalStrength: strength, currentStation: station });
  },

  setDialPosition(pos) {
    const clamped = Math.max(0, Math.min(1, pos));
    const frequency = Math.round(positionToFreq(clamped));
    const { stations } = get();
    const { strength, station } = calcSignal(frequency, stations);

    localStorage.setItem(STORAGE_KEY_DIAL, String(clamped));
    set({
      dialPosition: clamped,
      frequency,
      signalStrength: strength,
      currentStation: station,
    });
  },

  nudgeDialPosition(delta) {
    const { dialPosition } = get();
    get().setDialPosition(dialPosition + delta);
  },

  setEpisodeQueue(queue, startIndex = 0) {
    const episode = queue[startIndex] ?? null;
    set({ episodeQueue: queue, episodeIndex: startIndex, currentEpisode: episode });
  },

  setIsLoadingEpisodes(loading) {
    set({ isLoadingEpisodes: loading });
  },

  setIsPlaying(playing) {
    set({ isPlaying: playing });
  },

  setVolume(vol) {
    set({ volume: Math.max(0, Math.min(1, vol)) });
  },

  skipNext() {
    const { episodeQueue, episodeIndex, currentStation, stationProgress } = get();
    if (!episodeQueue.length) return;
    const nextIndex = (episodeIndex + 1) % episodeQueue.length;
    const episode = episodeQueue[nextIndex];

    const progress = currentStation
      ? { ...stationProgress, [currentStation.id]: nextIndex }
      : stationProgress;
    if (currentStation) localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));

    set({ episodeIndex: nextIndex, currentEpisode: episode, stationProgress: progress });
  },

  skipPrev() {
    const { episodeQueue, episodeIndex } = get();
    if (!episodeQueue.length) return;
    const prevIndex = episodeIndex <= 0 ? episodeQueue.length - 1 : episodeIndex - 1;
    set({ episodeIndex: prevIndex, currentEpisode: episodeQueue[prevIndex] });
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
