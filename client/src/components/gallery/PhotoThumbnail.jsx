export function PhotoThumbnail({ photo, selected, onToggle }) {
  return (
    <div
      className={`photo-thumb ${selected ? 'photo-thumb--selected' : ''}`}
      onClick={() => onToggle(photo.id)}
      title={photo.originalName}
    >
      <img src={photo.thumbUrl} alt={photo.originalName} loading="lazy" />
      <span className={`select-badge ${selected ? 'select-badge--on' : ''}`}>{selected ? '✓' : ''}</span>
    </div>
  );
}
