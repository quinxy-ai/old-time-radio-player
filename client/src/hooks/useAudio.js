import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../stores/radioStore.js';

// Zone boundaries must match Dial.jsx S-meter zones.
// Red  0.00–0.25 → all static
// Yellow 0.25–0.50 → linear mix
// Green  0.50–1.00 → all station
const YELLOW_START = 0.25;
const GREEN_START  = 0.50;

// Minimum static fraction to play while station audio is buffering/stalling.
// Keeps silence from being dead — a low crackle is better than nothing.
const BUFFERING_STATIC_FLOOR = 0.22;

function signalToMix(strength) {
  if (strength <= YELLOW_START) return { stationFrac: 0, staticFrac: 1 };
  if (strength >= GREEN_START)  return { stationFrac: 1, staticFrac: 0 };
  const t = (strength - YELLOW_START) / (GREEN_START - YELLOW_START);
  return { stationFrac: t, staticFrac: 1 - t };
}

export function useAudio({ bufferingStatic = true } = {}) {
  const audioRef  = useRef(null);
  const staticRef = useRef(null);

  // Refs to current values so event handlers always see fresh state
  const signalStrengthRef    = useRef(0);
  const volumeRef            = useRef(0.7);
  const isBufferingRef       = useRef(false);
  const bufferingStaticRef   = useRef(bufferingStatic);

  const currentEpisode    = useRadioStore((s) => s.currentEpisode);
  const isPlaying         = useRadioStore((s) => s.isPlaying);
  const volume            = useRadioStore((s) => s.volume);
  const signalStrength    = useRadioStore((s) => s.signalStrength);
  const setIsPlaying      = useRadioStore((s) => s.setIsPlaying);
  const setIsBuffering    = useRadioStore((s) => s.setIsBuffering);
  const skipNext          = useRadioStore((s) => s.skipNext);

  // Keep refs in sync
  useEffect(() => { signalStrengthRef.current = signalStrength; }, [signalStrength]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { bufferingStaticRef.current = bufferingStatic; }, [bufferingStatic]);

  // Apply volumes to both audio elements, respecting buffering floor
  const applyVolumes = useCallback(() => {
    const sig = signalStrengthRef.current;
    const vol = volumeRef.current;
    const { stationFrac, staticFrac } = signalToMix(sig);

    // While station audio is stalling, keep a low static floor so silence is masked
    const effectiveStaticFrac = bufferingStaticRef.current && isBufferingRef.current && stationFrac > 0
      ? Math.max(staticFrac, BUFFERING_STATIC_FLOOR)
      : staticFrac;

    if (audioRef.current)  audioRef.current.volume  = vol * stationFrac;
    if (staticRef.current) {
      staticRef.current.volume = vol * effectiveStaticFrac;
      if (staticRef.current.paused) staticRef.current.play().catch(() => {});
    }
  }, []);

  // Create both audio elements once and attach buffering listeners
  useEffect(() => {
    const station = new Audio();
    station.preload = 'auto';
    audioRef.current = station;

    const onEnded   = () => skipNext();
    const onPlay    = () => setIsPlaying(true);
    const onPause   = () => setIsPlaying(false);
    const onWaiting = () => {
      isBufferingRef.current = true;
      setIsBuffering(true);
      applyVolumes(); // immediately boost static to floor
    };
    const onPlaying = () => {
      isBufferingRef.current = false;
      setIsBuffering(false);
      applyVolumes(); // immediately restore normal crossfade
    };

    station.addEventListener('ended',   onEnded);
    station.addEventListener('play',    onPlay);
    station.addEventListener('pause',   onPause);
    station.addEventListener('waiting', onWaiting);
    station.addEventListener('playing', onPlaying);
    station.addEventListener('canplay', onPlaying); // also fires when ready after load

    const noise = new Audio('/radio-static.mp3');
    noise.loop   = true;
    noise.volume = 0;
    staticRef.current = noise;

    return () => {
      station.pause();
      station.removeEventListener('ended',   onEnded);
      station.removeEventListener('play',    onPlay);
      station.removeEventListener('pause',   onPause);
      station.removeEventListener('waiting', onWaiting);
      station.removeEventListener('playing', onPlaying);
      station.removeEventListener('canplay', onPlaying);
      noise.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load new episode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentEpisode) {
      audio.pause();
      audio.src = '';
      isBufferingRef.current = false;
      setIsBuffering(false);
      return;
    }
    isBufferingRef.current = true; // assume buffering until 'playing' fires
    setIsBuffering(true);
    const wasPlaying = isPlaying;
    audio.src = currentEpisode.url;
    audio.load();
    if (wasPlaying) audio.play().catch(() => {});
  }, [currentEpisode?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone-aware crossfade — runs on signal or volume change
  useEffect(() => {
    applyVolumes();
  }, [volume, signalStrength, applyVolumes]);

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
