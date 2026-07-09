export function PhotoCard({ photo, selected, onToggle }) {
  return (
    <div className={`photo-card ${selected ? 'photo-card--selected' : ''}`} onClick={() => onToggle(photo.id)}>
      <div className="photo-card-image-wrap">
        <img src={photo.thumbUrl} alt={photo.originalName} loading="lazy" />
        <span className={`select-badge ${selected ? 'select-badge--on' : ''}`}>{selected ? '✓' : ''}</span>
      </div>
      <div className="photo-card-info">
        <p className="photo-card-name">{photo.originalName}</p>
        <p className="photo-card-date">{new Date(photo.createdAt).toLocaleDateString('ko-KR')}</p>
        {photo.tags?.length > 0 && (
          <div className="photo-card-tags">
            {photo.tags.map((t) => (
              <span key={t.id} className="tag-chip">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
