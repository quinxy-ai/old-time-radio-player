import { useEffect, useRef, useState } from 'react';
import { useRadioStore } from './stores/radioStore.js';
import { useAudio } from './hooks/useAudio.js';
import { useSleepTimer } from './hooks/useSleepTimer.js';
import { useSettings, SENSITIVITY_MULTIPLIER } from './hooks/useSettings.js';
import { fetchStations, fetchStationEpisodes } from './services/api.js';
import { Radio } from './components/Radio/Radio.jsx';
import { SettingsDialog } from './components/SettingsDialog/SettingsDialog.jsx';

// Base tuning sensitivities — multiplied by the sensitivity setting
const BASE_DIAL_SENSITIVITY = 0.12;   // for SVG dial drag
const BASE_KNOB_SENSITIVITY = 0.15;   // for TUNE knob

export default function App() {
  const {
    dialPosition,
    stations,
    currentStation,
    approachingStation,
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

  const { settings, updateSettings } = useSettings();
  const { sleepLabel, addSleep } = useSleepTimer(settings.sleepMinutes);
  useAudio({ bufferingStatic: settings.bufferingStatic });

  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadedStationRef  = useRef(null);
  const prevStationRef    = useRef(null);
  const prefetchCacheRef  = useRef({});
  const prefetchingRef    = useRef(new Set());

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch((err) => console.error('Failed to load stations:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fetch episodes when dial is approaching a station (signal > 0.20)
  useEffect(() => {
    const station = approachingStation;
    if (!station) return;
    if (station.type === 'favorites') return;
    if (prefetchCacheRef.current[station.id]) return;
    if (prefetchingRef.current.has(station.id)) return;

    const saved = getSavedProgress(station.id);
    if (saved) {
      prefetchCacheRef.current[station.id] = saved.queue;
      return;
    }

    prefetchingRef.current.add(station.id);
    fetchStationEpisodes(station.id)
      .then((episodes) => {
        if (episodes.length > 0) prefetchCacheRef.current[station.id] = episodes;
      })
      .catch(() => {})
      .finally(() => prefetchingRef.current.delete(station.id));
  }, [approachingStation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setEpisodeQueue([]);
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

    // Use pre-fetched cache if available — skips API round-trip
    const cached = prefetchCacheRef.current[currentStation.id];
    if (cached?.length > 0) {
      setEpisodeQueue(cached);
      setIsPlaying(true);
      return;
    }

    setIsLoadingEpisodes(true);
    fetchStationEpisodes(currentStation.id)
      .then((episodes) => {
        if (episodes.length > 0) {
          prefetchCacheRef.current[currentStation.id] = episodes;
          setEpisodeQueue(episodes);
          setIsPlaying(true);
        }
      })
      .catch((err) => console.error('Failed to load episodes:', err))
      .finally(() => setIsLoadingEpisodes(false));
  }, [currentStation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensitivityMult = SENSITIVITY_MULTIPLIER[settings.dialSensitivity] ?? 1;

  function handleDialPositionChange(pos) {
    // SVG dial drag already applies its own TUNING_SENSITIVITY internally;
    // we just pass through but apply the user sensitivity to the TUNE knob below
    setDialPosition(pos);
  }

  function handleTuneKnobDelta(normalizedDelta) {
    nudgeDialPosition(normalizedDelta * BASE_KNOB_SENSITIVITY * sensitivityMult);
  }

  const canSkipPrev = Boolean(currentEpisode) && currentStation?.type !== 'genre';

  return (
    <>
      <Radio
        dialPosition={dialPosition}
        onDialPositionChange={handleDialPositionChange}
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
        sleepLabel={sleepLabel}
        sleepActive={Boolean(sleepLabel)}
        onVolumeChange={setVolume}
        onTuneKnobDelta={handleTuneKnobDelta}
        onSkipNext={skipNext}
        onSkipPrev={skipPrev}
        onToggleFavorite={toggleFavorite}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onToggleDialMode={toggleDialMode}
        onSleep={addSleep}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
