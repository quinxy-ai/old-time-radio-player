import { useEffect, useRef } from 'react';
import { useRadioStore } from './stores/radioStore.js';
import { useAudio } from './hooks/useAudio.js';
import { fetchStations, fetchStationEpisodes } from './services/api.js';
import { Radio } from './components/Radio/Radio.jsx';

const TUNING_SENSITIVITY = 0.15;

export default function App() {
  const {
    dialPosition,
    stations,
    currentStation,
    currentEpisode,
    isPlaying,
    signalStrength,
    volume,
    favorites,
    isLoadingEpisodes,
    dialMode,
    setStations,
    setDialPosition,
    nudgeDialPosition,
    setVolume,
    setEpisodeQueue,
    setIsLoadingEpisodes,
    setIsPlaying,
    skipNext,
    skipPrev,
    toggleFavorite,
    isCurrentFavorite,
    toggleDialMode,
    saveStationProgress,
    getSavedProgress,
  } = useRadioStore();

  useAudio();

  const loadedStationRef = useRef(null);
  const prevStationRef   = useRef(null);

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch((err) => console.error('Failed to load stations:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Save progress for genre/fixed station we're leaving
    if (
      prevStationRef.current &&
      prevStationRef.current.id !== currentStation?.id &&
      (prevStationRef.current.type === 'genre' || prevStationRef.current.type === 'fixed')
    ) {
      const { episodeQueue, episodeIndex } = useRadioStore.getState();
      saveStationProgress(prevStationRef.current.id, episodeQueue, episodeIndex);
    }
    prevStationRef.current = currentStation;

    if (!currentStation) {
      loadedStationRef.current = null;
      return;
    }

    if (loadedStationRef.current === currentStation.id) return;
    loadedStationRef.current = currentStation.id;

    setEpisodeQueue([]);

    if (currentStation.type === 'favorites') {
      const shuffled = [...favorites].sort(() => Math.random() - 0.5);
      setEpisodeQueue(shuffled);
      return;
    }

    // Restore saved position for genre and fixed stations
    if (currentStation.type === 'genre' || currentStation.type === 'fixed') {
      const saved = getSavedProgress(currentStation.id);
      if (saved) {
        setEpisodeQueue(saved.queue, saved.index);
        setIsPlaying(true);
        return;
      }
    }

    setIsLoadingEpisodes(true);
    fetchStationEpisodes(currentStation.id)
      .then((episodes) => {
        if (episodes.length > 0) {
          setEpisodeQueue(episodes);
          setIsPlaying(true);
        }
      })
      .catch((err) => console.error('Failed to load episodes:', err))
      .finally(() => setIsLoadingEpisodes(false));
  }, [currentStation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTuneKnobDelta(normalizedDelta) {
    nudgeDialPosition(normalizedDelta * TUNING_SENSITIVITY);
  }

  const canSkipPrev = Boolean(currentEpisode) && currentStation?.type !== 'genre';

  return (
    <Radio
      dialPosition={dialPosition}
      onDialPositionChange={setDialPosition}
      stations={stations}
      currentStation={currentStation}
      currentEpisode={currentEpisode}
      isPlaying={isPlaying}
      signalStrength={signalStrength}
      volume={volume}
      isFavorite={isCurrentFavorite()}
      isLoadingEpisodes={isLoadingEpisodes}
      dialMode={dialMode}
      canSkipPrev={canSkipPrev}
      onVolumeChange={setVolume}
      onTuneKnobDelta={handleTuneKnobDelta}
      onSkipNext={skipNext}
      onSkipPrev={skipPrev}
      onToggleFavorite={toggleFavorite}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
      onToggleDialMode={toggleDialMode}
    />
  );
}
