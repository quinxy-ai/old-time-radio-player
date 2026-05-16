import { useEffect, useRef } from 'react';
import { useRadioStore } from './stores/radioStore.js';
import { useAudio } from './hooks/useAudio.js';
import { fetchStations, fetchStationEpisodes } from './services/api.js';
import { Radio } from './components/Radio/Radio.jsx';

const TUNING_SENSITIVITY = 0.15; // fraction of full dial range per full knob revolution

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
  } = useRadioStore();

  useAudio(); // manages the Audio element reactively

  const loadedStationRef = useRef(null);

  // Load station list on mount
  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch((err) => console.error('Failed to load stations:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the active station changes, load its episode queue
  useEffect(() => {
    if (!currentStation) return;
    if (loadedStationRef.current === currentStation.id) return;
    loadedStationRef.current = currentStation.id;

    if (currentStation.type === 'favorites') {
      // Favorites are stored locally; shuffle them
      const shuffled = [...favorites].sort(() => Math.random() - 0.5);
      setEpisodeQueue(shuffled);
      return;
    }

    setIsLoadingEpisodes(true);
    fetchStationEpisodes(currentStation.id)
      .then((episodes) => {
        if (episodes.length > 0) {
          setEpisodeQueue(episodes);
          // Auto-play when tuning in
          setIsPlaying(true);
        }
      })
      .catch((err) => console.error('Failed to load episodes:', err))
      .finally(() => setIsLoadingEpisodes(false));
  }, [currentStation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When tuning away from a station, reset loaded tracker so it reloads on return
  useEffect(() => {
    if (!currentStation) {
      loadedStationRef.current = null;
    }
  }, [currentStation]);

  function handleTuneKnobDelta(normalizedDelta) {
    nudgeDialPosition(normalizedDelta * TUNING_SENSITIVITY);
  }

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
      onVolumeChange={setVolume}
      onTuneKnobDelta={handleTuneKnobDelta}
      onSkipNext={skipNext}
      onSkipPrev={skipPrev}
      onToggleFavorite={toggleFavorite}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
    />
  );
}
