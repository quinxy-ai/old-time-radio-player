import { SpeakerGrill } from '../SpeakerGrill/SpeakerGrill.jsx';
import { Dial } from '../Dial/Dial.jsx';
import { Knob } from '../Knob/Knob.jsx';
import { NixieDisplay } from '../NixieDisplay/NixieDisplay.jsx';
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

  const canPlay = Boolean(currentEpisode);

  return (
    <div className={styles.cabinet}>
      {/* Brand header */}
      <div className={styles.header}>
        <div className={styles.brandName}>NOSTALGIA</div>
        <div className={styles.brandModel}>Model OTR-1940</div>
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Large round tuning dial — centrepiece display */}
      <Dial
        dialPosition={dialPosition}
        onPositionChange={onDialPositionChange}
        stations={stations}
        signalStrength={signalStrength}
      />

      {/* Nixie tube display */}
      <NixieDisplay line1={nixieLine1} line2={nixieLine2} />

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Knob row: Volume | Tune | Favourite lamp-button */}
      <div className={styles.knobRow}>
        {/* Volume — 15 % smaller than base knob */}
        <div className={styles.volWrap}>
          <Knob
            label="VOL"
            value={volume}
            onDelta={(d) => onVolumeChange(volume + d * 0.8)}
          />
        </div>

        {/* Tune — scaled up to be the "big" centre knob */}
        <div className={styles.tuneWrap}>
          <Knob
            label="TUNE"
            value={dialPosition}
            onDelta={onTuneKnobDelta}
          />
        </div>

        {/* Favourite jewel-lamp button */}
        <div className={styles.favWrap}>
          <button
            className={`${styles.favBtn} ${isFavorite ? styles.favBtnOn : ''}`}
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            title={isFavorite ? 'Unfavourite' : 'Favourite'}
          />
          <span className={styles.knobLabel}>FAV</span>
        </div>
      </div>

      {/* Transport row: Prev | Pause | Next — blank buttons, text below */}
      <div className={styles.transportRow}>
        <div className={styles.transportWrap}>
          <button
            className={styles.transportBtn}
            onClick={onSkipPrev}
            disabled={!canPlay}
            aria-label="Previous track"
          />
          <span className={styles.transportLabel}>PRV</span>
        </div>
        <div className={styles.transportWrap}>
          <button
            className={`${styles.transportBtn} ${isPlaying ? styles.transportBtnActive : ''}`}
            onClick={onTogglePlay}
            disabled={!canPlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          />
          <span className={styles.transportLabel}>PSE</span>
        </div>
        <div className={styles.transportWrap}>
          <button
            className={styles.transportBtn}
            onClick={onSkipNext}
            disabled={!canPlay}
            aria-label="Next track"
          />
          <span className={styles.transportLabel}>NXT</span>
        </div>
      </div>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Speaker grill */}
      <SpeakerGrill />

      {/* Cabinet feet */}
      <div className={styles.feet}>
        <div className={styles.foot} />
        <div className={styles.foot} />
      </div>
    </div>
  );
}
