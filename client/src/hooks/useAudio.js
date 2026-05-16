import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../stores/radioStore.js';

// Manages station audio + static crossfade based on signal strength.
// Static volume  = (1 - signalStrength) * masterVolume
// Station volume = signalStrength * masterVolume
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
    noise.play().catch(() => {}); // auto-starts muted; volume driven by signalStrength
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

  // Crossfade: station audio attenuates out, static fades in as signal drops
  useEffect(() => {
    if (audioRef.current)  audioRef.current.volume  = volume * signalStrength;
    if (staticRef.current) staticRef.current.volume = volume * (1 - signalStrength);
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
