import { useRef } from 'react';
import { SpeakerGrill } from '../SpeakerGrill/SpeakerGrill.jsx';
import { Dial } from '../Dial/Dial.jsx';
import { Knob } from '../Knob/Knob.jsx';
import { NixieDisplay } from '../NixieDisplay/NixieDisplay.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import { useClickSound } from '../../hooks/useClickSound.js';
import styles from './Radio.module.css';

const LONG_PRESS_MS = 600;

const VOL_SIZE = 49;
const TUNE_SIZE = Math.min(174, Math.max(100, Math.round(window.innerHeight * 0.22)));

export function Radio({
  dialPosition,
  onDialPositionChange,
  stations,
  currentStation,
  currentEpisode,
  isPlaying,
  signalStrength,
  volume,
  isFavorite,
  isLoadingEpisodes,
  dialMode,
  canSkipPrev,
  sleepLabel,
  sleepActive,
  showTooltips,
  showNixie,
  onSleepCancel,
  onVolumeChange,
  onTuneKnobDelta,
  onSkipNext,
  onSkipPrev,
  onToggleFavorite,
  onTogglePlay,
  onToggleDialMode,
  onSleep,
  onOpenSettings,
}) {
  const tt = showTooltips; // shorthand
  const { playClick, playBuzzer } = useClickSound();
  const sleepPressTimer  = useRef(null);
  const sleepDidLongPress = useRef(false);

  const nixieLine1 = currentStation
    ? currentStation.name.toUpperCase()
    : signalStrength > 0
    ? 'TUNING...'
    : 'NO SIGNAL';

  const nixieLine2 = isLoadingEpisodes
    ? 'LOADING...'
    : currentEpisode
    ? currentEpisode.title.toUpperCase()
    : '';

  const canPlay = Boolean(currentEpisode);

  function handleSkipPrev() {
    if (!canSkipPrev) { playBuzzer(); return; }
    playClick();
    onSkipPrev();
  }

  function handleTogglePlay() {
    if (!canPlay) { playBuzzer(); return; }
    playClick();
    onTogglePlay();
  }

  function handleSkipNext() {
    if (!canPlay) { playBuzzer(); return; }
    playClick();
    onSkipNext();
  }

  function handleToggleFavorite() {
    playClick();
    onToggleFavorite();
  }

  function handleSleepPointerDown() {
    sleepDidLongPress.current = false;
    sleepPressTimer.current = setTimeout(() => {
      sleepDidLongPress.current = true;
      if (sleepActive) { playClick(); onSleepCancel(); }
    }, LONG_PRESS_MS);
  }

  function handleSleepPointerUp() {
    clearTimeout(sleepPressTimer.current);
    if (!sleepDidLongPress.current) { playClick(); onSleep(); }
  }

  function handleSleepPointerLeave() {
    clearTimeout(sleepPressTimer.current);
  }

  function handleOpenSettings() {
    playClick();
    onOpenSettings();
  }

  return (
    <div className={styles.cabinet}>
      {/* Nixie tube display — above the dial */}
      {showNixie && <NixieDisplay line1={nixieLine1} line2={nixieLine2} rightLabel={sleepLabel ?? ''} />}

      {/* Large round tuning dial */}
      <Dial
        dialPosition={dialPosition}
        onPositionChange={onDialPositionChange}
        stations={stations}
        signalStrength={signalStrength}
        dialMode={dialMode}
      />

      {/* Dial mode toggle — GNR / SHW — sits just below the dial */}
      <div className={styles.modeToggleRow}>
        <div className={styles.modeToggle}>
          <Tooltip text="Genre mode — tune across themed stations: Mystery, Comedy, Western, and more" enabled={tt}>
            <button
              className={`${styles.modeBtn} ${dialMode === 'genre' ? styles.modeBtnActive : ''}`}
              onClick={() => { playClick(); if (dialMode !== 'genre') onToggleDialMode(); }}
              aria-label="Genre station mode"
            >
              GNR
            </button>
          </Tooltip>
          <Tooltip text="Show mode — each dial position is a dedicated station for one classic show, playing episodes in order and resuming where you left off" enabled={tt}>
            <button
              className={`${styles.modeBtn} ${dialMode === 'fixed' ? styles.modeBtnActive : ''}`}
              onClick={() => { playClick(); if (dialMode !== 'fixed') onToggleDialMode(); }}
              aria-label="Fixed show mode"
            >
              SHW
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Knob row */}
      <div className={styles.knobRow}>
        <Tooltip text="Volume" enabled={tt} className={styles.knobCol}>
          <Knob
            label="VOL"
            value={volume}
            size={VOL_SIZE}
            onDelta={(d) => onVolumeChange(volume + d * 0.8)}
          />
        </Tooltip>

        <Tooltip text="Fine Tune — drag to sweep the dial with precision" enabled={tt} className={styles.knobCol}>
          <Knob
            label="TUNE"
            value={dialPosition}
            size={TUNE_SIZE}
            onDelta={onTuneKnobDelta}
          />
        </Tooltip>

        <Tooltip text="Favourites — save or remove this episode" enabled={tt} className={styles.knobCol}>
          <button
            className={`${styles.favBtn} ${isFavorite ? styles.favBtnOn : ''}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          />
          <span className={styles.knobLabel}>FAV</span>
        </Tooltip>
      </div>

      {/* Transport row — SLP (under VOL) | PRV PSE NXT | SET (under FAV) */}
      <div className={styles.transportRow}>
        {/* SLP — left column, aligns under VOL */}
        <Tooltip text="Sleep Timer — tap to add time, long-press to cancel" enabled={tt} className={styles.transportWrap}>
          <button
            className={`${styles.transportBtn} ${sleepActive ? styles.transportBtnSleep : ''}`}
            onPointerDown={handleSleepPointerDown}
            onPointerUp={handleSleepPointerUp}
            onPointerLeave={handleSleepPointerLeave}
            aria-label={sleepActive ? `Sleep: ${sleepLabel} — long press to cancel` : 'Start sleep timer'}
          />
          <span className={styles.transportLabel}>SLP</span>
        </Tooltip>

        {/* PRV PSE NXT — centre column */}
        <div className={styles.transportCenter}>
          <Tooltip text="Previous Episode" enabled={tt} className={styles.transportWrap}>
            <button
              className={`${styles.transportBtn} ${!canSkipPrev ? styles.transportBtnDisabled : ''}`}
              onClick={handleSkipPrev}
              aria-label="Previous track"
            />
            <span className={styles.transportLabel}>PRV</span>
          </Tooltip>
          <Tooltip text="Play / Pause" enabled={tt} className={styles.transportWrap}>
            <button
              className={`${styles.transportBtn} ${isPlaying ? styles.transportBtnActive : ''}`}
              onClick={handleTogglePlay}
              disabled={!canPlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            />
            <span className={styles.transportLabel}>PSE</span>
          </Tooltip>
          <Tooltip text="Next Episode" enabled={tt} className={styles.transportWrap}>
            <button
              className={styles.transportBtn}
              onClick={handleSkipNext}
              disabled={!canPlay}
              aria-label="Next track"
            />
            <span className={styles.transportLabel}>NXT</span>
          </Tooltip>
        </div>

        {/* SET — right column, aligns under FAV */}
        <Tooltip text="Settings" enabled={tt} className={styles.transportWrap}>
          <button
            className={styles.transportBtn}
            onClick={handleOpenSettings}
            aria-label="Open settings"
          />
          <span className={styles.transportLabel}>SET</span>
        </Tooltip>
      </div>

      {/* Speaker grill — hidden on short screens via CSS */}
      <div className={styles.grillSection}>
        <div className={styles.divider} />
        <SpeakerGrill />
      </div>

      {/* Cabinet feet */}
      <div className={styles.feet}>
        <div className={styles.foot} />
        <div className={styles.foot} />
      </div>
    </div>
  );
}
