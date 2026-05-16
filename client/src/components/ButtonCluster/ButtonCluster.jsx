import styles from './ButtonCluster.module.css';

export function ButtonCluster({
  isPlaying,
  currentEpisode,
  isFavorite,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  onToggleFavorite,
}) {
  const disabled = !currentEpisode;

  return (
    <div className={styles.cluster}>
      <div className={styles.label}>CONTROLS</div>
      <div className={styles.row}>
        <button
          className={styles.nubbin}
          onClick={onSkipPrev}
          disabled={disabled}
          aria-label="Previous track"
          title="Prev"
        >⏮</button>
        <button
          className={`${styles.nubbin} ${isPlaying ? styles.active : ''}`}
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >{isPlaying ? '⏸' : '▶'}</button>
        <button
          className={styles.nubbin}
          onClick={onSkipNext}
          disabled={disabled}
          aria-label="Next track"
          title="Next"
        >⏭</button>
      </div>
      <div className={styles.favRow}>
        <button
          className={`${styles.nubbin} ${isFavorite ? styles.active : ''}`}
          onClick={onToggleFavorite}
          aria-label="Toggle favorite"
          title="Favorite"
        >★</button>
        <div className={`${styles.lamp} ${isFavorite ? styles.lampOn : ''}`} aria-hidden="true" />
      </div>
    </div>
  );
}
