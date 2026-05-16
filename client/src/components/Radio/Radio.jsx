import { SpeakerGrill } from '../SpeakerGrill/SpeakerGrill.jsx';
import { Dial } from '../Dial/Dial.jsx';
import { Knob } from '../Knob/Knob.jsx';
import { NixieDisplay } from '../NixieDisplay/NixieDisplay.jsx';
import { SignalMeter } from '../SignalMeter/SignalMeter.jsx';
import styles from './Radio.module.css';

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
  onVolumeChange,
  onTuneKnobDelta,
  onSkipNext,
  onSkipPrev,
  onToggleFavorite,
  onTogglePlay,
}) {
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

  return (
    <div className={styles.cabinet}>
      {/* Brand header */}
      <div className={styles.header}>
        <div className={styles.brandName}>NOSTALGIA</div>
        <div className={styles.brandModel}>Model OTR-1940</div>
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Round tuning dial — centrepiece */}
      <Dial
        dialPosition={dialPosition}
        onPositionChange={onDialPositionChange}
        stations={stations}
      />

      {/* Nixie tube display */}
      <NixieDisplay line1={nixieLine1} line2={nixieLine2} />

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Knob row */}
      <div className={styles.knobRow}>
        <Knob
          label="Volume"
          value={volume}
          onDelta={(d) => onVolumeChange(volume + d * 0.8)}
        />
        <Knob
          label="Tune"
          value={dialPosition}
          onDelta={onTuneKnobDelta}
        />
        <Knob
          label="Fav"
          value={isFavorite ? 1 : 0}
          onDelta={() => {}}
          onClick={onToggleFavorite}
          active={isFavorite}
          icon="★"
        />
        <Knob
          label="Skip"
          value={0.5}
          onDelta={(d) => {
            if (d > 0.03) onSkipNext();
            if (d < -0.03) onSkipPrev();
          }}
          onClick={onSkipNext}
          icon="▶▶"
        />
      </div>

      {/* Play/pause + signal meter row */}
      <div className={styles.controlRow}>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onClick={onTogglePlay}
          disabled={!currentEpisode}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <SignalMeter strength={signalStrength} />
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Speaker grill at the bottom */}
      <SpeakerGrill />

      {/* Cabinet feet */}
      <div className={styles.feet}>
        <div className={styles.foot} />
        <div className={styles.foot} />
      </div>
    </div>
  );
}
