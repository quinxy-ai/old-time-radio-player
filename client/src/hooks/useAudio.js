import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../stores/radioStore.js';

// Zone boundaries (fraction of signalStrength 0–1) must match Dial.jsx S-meter zones.
// Red  0.00–0.25 → all static, no station
// Yellow 0.25–0.50 → linear mix
// Green  0.50–1.00 → all station, no static
const YELLOW_START = 0.25;
const GREEN_START  = 0.50;

function signalToMix(strength) {
  if (strength <= YELLOW_START) return { stationFrac: 0, staticFrac: 1 };
  if (strength >= GREEN_START)  return { stationFrac: 1, staticFrac: 0 };
  const t = (strength - YELLOW_START) / (GREEN_START - YELLOW_START);
  return { stationFrac: t, staticFrac: 1 - t };
}

export function useAudio() {
  const audioRef  = useRef(null);
  const staticRef = useRef(null);

  const currentEpisode  = useRadioStore((s) => s.currentEpisode);
  const isPlaying       = useRadioStore((s) => s.isPlaying);
  const volume          = useRadioStore((s) => s.volume);
  const signalStrength  = useRadioStore((s) => s.signalStrength);
  const setIsPlaying    = useRadioStore((s) => s.setIsPlaying);
  const skipNext        = useRadioStore((s) => s.skipNext);

  // Create both audio elements once
  useEffect(() => {
    const station = new Audio();
    station.preload = 'metadata';
    audioRef.current = station;

    const onEnded = () => skipNext();
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    station.addEventListener('ended', onEnded);
    station.addEventListener('play',  onPlay);
    station.addEventListener('pause', onPause);

    const noise = new Audio('/radio-static.mp3');
    noise.loop = true;
    noise.volume = 0;
    staticRef.current = noise;

    return () => {
      station.pause();
      station.removeEventListener('ended', onEnded);
      station.removeEventListener('play',  onPlay);
      station.removeEventListener('pause', onPause);
      noise.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load new episode when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentEpisode) {
      audio.pause();
      audio.src = '';
      return;
    }
    const wasPlaying = isPlaying;
    audio.src = currentEpisode.url;
    audio.load();
    if (wasPlaying) audio.play().catch(() => {});
  }, [currentEpisode?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone-aware crossfade. Static is started lazily here — this effect fires on user
  // interaction (tuning/volume change), satisfying the browser autoplay policy.
  // We retry static.play() on every tick while it's paused so a prior autoplay
  // rejection doesn't permanently silence it.
  useEffect(() => {
    const { stationFrac, staticFrac } = signalToMix(signalStrength);
    if (audioRef.current)  audioRef.current.volume  = volume * stationFrac;
    if (staticRef.current) {
      staticRef.current.volume = volume * staticFrac;
      if (staticRef.current.paused) {
        staticRef.current.play().catch(() => {});
      }
    }
  }, [volume, signalStrength]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = useCallback((seconds) => {
    if (audioRef.current) audioRef.current.currentTime += seconds;
  }, []);

  return { seek };
}
