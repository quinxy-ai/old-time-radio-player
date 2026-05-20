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
  const { sleepLabel, addSleep, cancelSleep } = useSleepTimer(settings.sleepMinutes);
  useAudio({ bufferingStatic: settings.bufferingStatic });

  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadedStationRef  = useRef(null);
  const loadEpochRef      = useRef(0);
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
      const { currentEpisode } = useRadioStore.getState();
      saveStationProgress(prevStationRef.current.id, currentEpisode?.id, currentEpisode?.showName);
    }
    prevStationRef.current = currentStation;

    if (!currentStation) {
      loadedStationRef.current = null;
      loadEpochRef.current++;   // invalidate any in-flight fetch
      setEpisodeQueue([]);
      return;
    }

    if (loadedStationRef.current === currentStation.id) return;
    loadedStationRef.current = currentStation.id;

    setEpisodeQueue([]);

    if (currentStation.type === 'favorites') {
      const shuffled = [...favorites].sort(() => Math.random() - 0.5);
      console.log(`[OTR] Station: ${currentStation.name} | source: favorites | episodes:`, shuffled.map(e => e.title));
      setEpisodeQueue(shuffled);
      return;
    }

    // Find the saved episode position within a freshly-loaded queue
    function startIndex(episodes) {
      const expectedShow = currentStation.type === 'fixed' ? currentStation.name : null;
      const saved = getSavedProgress(currentStation.id, expectedShow);
      if (!saved?.episodeId) return 0;
      const idx = episodes.findIndex((ep) => ep.id === saved.episodeId);
      return idx >= 0 ? idx : 0;
    }

    // Use pre-fetched cache if available — skips API round-trip
    const cached = prefetchCacheRef.current[currentStation.id];
    if (cached?.length > 0) {
      const idx = startIndex(cached);
      console.log(`[OTR] Station: ${currentStation.name} | source: prefetch-cache | start: ${idx} | episodes:`, cached.map(e => e.title));
      setEpisodeQueue(cached, idx);
      setIsPlaying(true);
      return;
    }

    setIsLoadingEpisodes(true);
    const stationIdAtLoad = currentStation.id;
    const epoch = ++loadEpochRef.current;
    fetchStationEpisodes(stationIdAtLoad)
      .then((episodes) => {
        if (loadEpochRef.current !== epoch) return; // tuned away before fetch completed
        if (episodes.length > 0) {
          const idx = startIndex(episodes);
          console.log(`[OTR] Station: ${currentStation.name} | source: api-fetch | start: ${idx} | episodes:`, episodes.map(e => e.title));
          prefetchCacheRef.current[stationIdAtLoad] = episodes;
          setEpisodeQueue(episodes, idx);
          setIsPlaying(true);
        }
      })
      .catch((err) => {
        if (loadEpochRef.current !== epoch) return;
        console.error('Failed to load episodes:', err);
      })
      .finally(() => {
        if (loadEpochRef.current === epoch) setIsLoadingEpisodes(false);
      });
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
        showTooltips={settings.showTooltips}
        onVolumeChange={setVolume}
        onTuneKnobDelta={handleTuneKnobDelta}
        onSkipNext={skipNext}
        onSkipPrev={skipPrev}
        onToggleFavorite={toggleFavorite}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onToggleDialMode={toggleDialMode}
        onSleep={addSleep}
        onSleepCancel={cancelSleep}
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
