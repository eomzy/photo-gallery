import { useSelection } from '../../state/SelectionContext.jsx';
import { PhotoCard } from './PhotoCard.jsx';
import { PhotoThumbnail } from './PhotoThumbnail.jsx';

export function GalleryView({ photos, loading }) {
  const { selectedIds, toggleSelect, viewMode } = useSelection();

  if (loading) return <p className="empty-state">불러오는 중…</p>;
  if (photos.length === 0) return <p className="empty-state">사진이 없습니다. 사진을 업로드해보세요.</p>;

  return (
    <div className={viewMode === 'card' ? 'gallery-grid gallery-grid--card' : 'gallery-grid gallery-grid--thumb'}>
      {photos.map((photo) =>
        viewMode === 'card' ? (
          <PhotoCard key={photo.id} photo={photo} selected={selectedIds.has(photo.id)} onToggle={toggleSelect} />
        ) : (
          <PhotoThumbnail key={photo.id} photo={photo} selected={selectedIds.has(photo.id)} onToggle={toggleSelect} />
        )
      )}
    </div>
  );
}
