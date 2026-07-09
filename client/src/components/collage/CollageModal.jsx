import { Modal } from '../common/Modal.jsx';
import { getSpan, MAX_SPECIAL } from './getSpan.js';

export function CollageModal({ photos, onClose }) {
  const useUniform = photos.length > MAX_SPECIAL;

  return (
    <Modal title={`콜라주 (${photos.length}장)`} onClose={onClose} wide>
      <div className={`collage-grid ${useUniform ? 'collage-grid--uniform' : ''}`}>
        {photos.map((photo, index) => {
          const span = useUniform ? null : getSpan(photos.length, index);
          return (
            <div
              key={photo.id}
              className="collage-tile"
              style={span ? { gridColumn: `span ${span.col}`, gridRow: `span ${span.row}` } : undefined}
            >
              <img src={photo.thumbUrl} alt={photo.originalName} />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
