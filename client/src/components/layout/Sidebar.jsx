export function Sidebar({ tags, activeTagId, onSelectTag }) {
  return (
    <aside className="sidebar">
      <h1 className="sidebar-title">사진 갤러리</h1>
      <button
        className={`sidebar-item ${activeTagId === null ? 'sidebar-item--active' : ''}`}
        onClick={() => onSelectTag(null)}
      >
        전체 사진
      </button>

      <div className="sidebar-section-label">폴더 (태그)</div>
      {tags.length === 0 && <p className="sidebar-empty">아직 폴더가 없습니다</p>}
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`sidebar-item ${activeTagId === tag.id ? 'sidebar-item--active' : ''}`}
          onClick={() => onSelectTag(tag.id)}
        >
          <span className="sidebar-item-name">📁 {tag.name}</span>
          <span className="sidebar-item-count">{tag.photoCount}</span>
        </button>
      ))}
    </aside>
  );
}
