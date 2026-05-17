import { useRef } from 'react';

export function useClickSound() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }

  function playClick() {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;

      // 1. Snap transient — short bandpass-filtered noise burst
      const snapLen = Math.floor(ctx.sampleRate * 0.018);
      const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapLen; i++) snapData[i] = Math.random() * 2 - 1;

      const snapSrc = ctx.createBufferSource();
      snapSrc.buffer = snapBuf;

      const snapBp = ctx.createBiquadFilter();
      snapBp.type = 'bandpass';
      snapBp.frequency.value = 3200;
      snapBp.Q.value = 0.7;

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.18, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.016);

      snapSrc.connect(snapBp);
      snapBp.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapSrc.start(t);
      snapSrc.stop(t + 0.02);

      // 2. Body thud — short sine sweep downward (mechanism mass)
      const thudOsc = ctx.createOscillator();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(160, t);
      thudOsc.frequency.exponentialRampToValueAtTime(55, t + 0.022);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.10, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(t);
      thudOsc.stop(t + 0.025);
    } catch { /* silent fail */ }
  }

  function playBuzzer() {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;

      // Paired detuned sawtooths → beating "wrong answer" tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.value = 110;
      osc2.frequency.value = 116; // slight detune creates a beating buzz

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 380;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.012);
      gain.gain.setValueAtTime(0.13, t + 0.17);
      gain.gain.linearRampToValueAtTime(0, t + 0.23);

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t); osc1.stop(t + 0.25);
      osc2.start(t); osc2.stop(t + 0.25);
    } catch { /* silent fail */ }
  }

  return { playClick, playBuzzer };
}
