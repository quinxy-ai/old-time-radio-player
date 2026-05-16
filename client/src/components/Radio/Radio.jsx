import { SpeakerGrill } from '../SpeakerGrill/SpeakerGrill.jsx';
import { Dial } from '../Dial/Dial.jsx';
import { Knob } from '../Knob/Knob.jsx';
import { NixieDisplay } from '../NixieDisplay/NixieDisplay.jsx';
import { ButtonCluster } from '../ButtonCluster/ButtonCluster.jsx';
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

      {/* Nixie tube display */}
      <NixieDisplay line1={nixieLine1} line2={nixieLine2} />

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Dial row: Volume | Round Dial | Button Cluster */}
      <div className={styles.dialRow}>
        {/* Volume knob — left */}
        <div className={styles.knobWrap}>
          <Knob
            label="VOL"
            value={volume}
            onDelta={(d) => onVolumeChange(volume + d * 0.8)}
          />
        </div>

        {/* Large round tuning dial — centre */}
        <Dial
          dialPosition={dialPosition}
          onPositionChange={onDialPositionChange}
          stations={stations}
          signalStrength={signalStrength}
        />

        {/* Button cluster — right */}
        <ButtonCluster
          isPlaying={isPlaying}
          currentEpisode={currentEpisode}
          isFavorite={isFavorite}
          onTogglePlay={onTogglePlay}
          onSkipNext={onSkipNext}
          onSkipPrev={onSkipPrev}
          onToggleFavorite={onToggleFavorite}
        />
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
