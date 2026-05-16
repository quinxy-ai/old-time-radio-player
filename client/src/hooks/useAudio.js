import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../stores/radioStore.js';

// Manages the HTML5 Audio element and syncs playback state to the store.
export function useAudio() {
  const audioRef = useRef(null);
  const currentEpisode = useRadioStore((s) => s.currentEpisode);
  const isPlaying = useRadioStore((s) => s.isPlaying);
  const volume = useRadioStore((s) => s.volume);
  const signalStrength = useRadioStore((s) => s.signalStrength);
  const setIsPlaying = useRadioStore((s) => s.setIsPlaying);
  const skipNext = useRadioStore((s) => s.skipNext);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onEnded = () => skipNext();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
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

  // Sync volume — attenuate by signal strength so off-station sounds quiet
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume * signalStrength;
  }, [volume, signalStrength]);

  // Sync play/pause commanded from store
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
