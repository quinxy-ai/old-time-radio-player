import { useCallback, useEffect, useRef, useState } from 'react';
import { useRadioStore } from '../stores/radioStore.js';

export function useSleepTimer(incrementMinutes = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef   = useRef(null);
  const isPlayingRef  = useRef(false);

  const setIsPlaying = useRadioStore((s) => s.setIsPlaying);
  const isPlaying    = useRadioStore((s) => s.isPlaying);

  // Keep ref in sync so the addSleep callback always sees fresh value
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const stopTicking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startTicking = useCallback(() => {
    stopTicking();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTicking, setIsPlaying]);

  const addSleep = useCallback(() => {
    setSecondsLeft((prev) => prev + incrementMinutes * 60);
    if (!isPlayingRef.current) setIsPlaying(true);
    startTicking();
  }, [incrementMinutes, setIsPlaying, startTicking]);

  // Cleanup on unmount
  useEffect(() => () => stopTicking(), [stopTicking]);

  const sleepLabel = secondsLeft > 0
    ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
    : null;

  return { secondsLeft, sleepLabel, addSleep };
}
