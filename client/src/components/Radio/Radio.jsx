import { SpeakerGrill } from '../SpeakerGrill/SpeakerGrill.jsx';
import { Dial } from '../Dial/Dial.jsx';
import { Knob } from '../Knob/Knob.jsx';
import { NixieDisplay } from '../NixieDisplay/NixieDisplay.jsx';
import { useClickSound } from '../../hooks/useClickSound.js';
import styles from './Radio.module.css';

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
  onVolumeChange,
  onTuneKnobDelta,
  onSkipNext,
  onSkipPrev,
  onToggleFavorite,
  onTogglePlay,
  onToggleDialMode,
}) {
  const { playClick, playBuzzer } = useClickSound();

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

  return (
    <div className={styles.cabinet}>
      {/* Brand header */}
      <div className={styles.header}>
        <div className={styles.brandName}>OldTimeRad.io</div>
        <div className={styles.brandModel}>Model OTR-1937</div>
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Large round tuning dial */}
      <Dial
        dialPosition={dialPosition}
        onPositionChange={onDialPositionChange}
        stations={stations}
        signalStrength={signalStrength}
        dialMode={dialMode}
      />

      {/* Nixie tube display */}
      <NixieDisplay line1={nixieLine1} line2={nixieLine2} />

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Knob row */}
      <div className={styles.knobRow}>
        <div className={styles.knobCol}>
          <Knob
            label="VOL"
            value={volume}
            size={VOL_SIZE}
            onDelta={(d) => onVolumeChange(volume + d * 0.8)}
          />
        </div>

        <div className={styles.knobCol}>
          <Knob
            label="TUNE"
            value={dialPosition}
            size={TUNE_SIZE}
            onDelta={onTuneKnobDelta}
          />
        </div>

        <div className={styles.knobCol}>
          <button
            className={`${styles.favBtn} ${isFavorite ? styles.favBtnOn : ''}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          />
          <span className={styles.knobLabel}>FAV</span>
        </div>
      </div>

      {/* Transport row */}
      <div className={styles.transportRow}>
        <div className={styles.transportWrap}>
          <button
            className={`${styles.transportBtn} ${!canSkipPrev ? styles.transportBtnDisabled : ''}`}
            onClick={handleSkipPrev}
            aria-label="Previous track"
          />
          <span className={styles.transportLabel}>PRV</span>
        </div>
        <div className={styles.transportWrap}>
          <button
            className={`${styles.transportBtn} ${isPlaying ? styles.transportBtnActive : ''}`}
            onClick={handleTogglePlay}
            disabled={!canPlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          />
          <span className={styles.transportLabel}>PSE</span>
        </div>
        <div className={styles.transportWrap}>
          <button
            className={styles.transportBtn}
            onClick={handleSkipNext}
            disabled={!canPlay}
            aria-label="Next track"
          />
          <span className={styles.transportLabel}>NXT</span>
        </div>
      </div>

      {/* Dial mode toggle — GNR / SHW */}
      <div className={styles.modeToggleRow}>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${dialMode === 'genre' ? styles.modeBtnActive : ''}`}
            onClick={() => { playClick(); if (dialMode !== 'genre') onToggleDialMode(); }}
            aria-label="Genre station mode"
          >
            GNR
          </button>
          <button
            className={`${styles.modeBtn} ${dialMode === 'fixed' ? styles.modeBtnActive : ''}`}
            onClick={() => { playClick(); if (dialMode !== 'fixed') onToggleDialMode(); }}
            aria-label="Fixed show mode"
          >
            SHW
          </button>
        </div>
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
