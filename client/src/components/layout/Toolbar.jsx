import { useRef } from 'react';
import { useSelection } from '../../state/SelectionContext.jsx';

export function Toolbar({
  title,
  onUpload,
  uploading,
  onAssignTag,
  onCollage,
  onDeleteSelected,
  onMerge,
  onSlideshow,
  photoCount,
}) {
  const { selectedIds, clearSelection, viewMode, setViewMode } = useSelection();
  const fileInputRef = useRef(null);
  const selectedCount = selectedIds.size;

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <h2 className="toolbar-title">
          {title} <span className="toolbar-count">({photoCount})</span>
        </h2>

        <div className="toolbar-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'card' ? 'view-toggle-btn--active' : 'view-toggle-btn'}
              onClick={() => setViewMode('card')}
            >
              카드
            </button>
            <button
              className={viewMode === 'thumbnail' ? 'view-toggle-btn--active' : 'view-toggle-btn'}
              onClick={() => setViewMode('thumbnail')}
            >
              썸네일
            </button>
          </div>

          {onSlideshow && (
            <button className="btn btn-primary" onClick={onSlideshow} disabled={photoCount === 0}>
              ▶ 슬라이드쇼
            </button>
          )}
          {onMerge && (
            <button className="btn" onClick={onMerge}>
              다른 폴더와 병합
            </button>
          )}
          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) onUpload(e.target.files);
                  e.target.value = '';
                }}
              />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? '업로드 중…' : '+ 사진 업로드'}
              </button>
            </>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="selection-bar">
          <span>{selectedCount}개 선택됨</span>
          <button className="btn" onClick={onAssignTag}>
            태그 지정
          </button>
          <button className="btn" onClick={onCollage} disabled={selectedCount < 2}>
            콜라주 보기
          </button>
          <button className="btn btn-danger" onClick={onDeleteSelected}>
            삭제
          </button>
          <button className="btn btn-link" onClick={clearSelection}>
            선택 해제
          </button>
        </div>
      )}
    </div>
  );
}
