export function TopNav({ tags, activeTagId, onSelectTag }) {
  return (
    <header className="topnav">
      <h1 className="topnav-title">사진 갤러리</h1>
      <nav className="topnav-menu">
        <button
          className={`topnav-item ${activeTagId === null ? 'topnav-item--active' : ''}`}
          onClick={() => onSelectTag(null)}
        >
          전체 사진
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            className={`topnav-item ${activeTagId === tag.id ? 'topnav-item--active' : ''}`}
            onClick={() => onSelectTag(tag.id)}
          >
            📁 {tag.name}
            <span className="topnav-item-count">{tag.photoCount}</span>
          </button>
        ))}
        {tags.length === 0 && <span className="topnav-empty">아직 폴더가 없습니다</span>}
      </nav>
    </header>
  );
}
