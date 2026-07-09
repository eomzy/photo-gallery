import { useMemo, useState } from 'react';
import { SelectionProvider, useSelection } from './state/SelectionContext.jsx';
import { usePhotos } from './hooks/usePhotos.js';
import { useTags } from './hooks/useTags.js';
import { TopNav } from './components/layout/TopNav.jsx';
import { Toolbar } from './components/layout/Toolbar.jsx';
import { GalleryView } from './components/gallery/GalleryView.jsx';
import { CollageModal } from './components/collage/CollageModal.jsx';
import { TagAssignDialog } from './components/tags/TagAssignDialog.jsx';
import { MergeFoldersDialog } from './components/tags/MergeFoldersDialog.jsx';
import { SlideshowModal } from './components/slideshow/SlideshowModal.jsx';
import * as photosApi from './api/photos.api.js';

function GalleryApp() {
  const [activeTagId, setActiveTagId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialog, setDialog] = useState(null); // 'assign' | 'collage' | 'merge' | 'slideshow' | null

  const { tags, refetch: refetchTags } = useTags();
  const { photos, loading, refetch: refetchPhotos } = usePhotos(activeTagId ?? undefined);
  const { selectedIds, clearSelection } = useSelection();

  const activeTag = useMemo(() => tags.find((t) => t.id === activeTagId) ?? null, [tags, activeTagId]);
  const selectedPhotos = useMemo(() => photos.filter((p) => selectedIds.has(p.id)), [photos, selectedIds]);

  function handleSelectTag(tagId) {
    setActiveTagId(tagId);
    clearSelection();
  }

  async function handleUpload(fileList) {
    setUploading(true);
    try {
      await photosApi.uploadPhotos(Array.from(fileList));
      await refetchPhotos();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteSelected() {
    if (!window.confirm(`선택한 ${selectedIds.size}장의 사진을 삭제할까요?`)) return;
    await Promise.all([...selectedIds].map((id) => photosApi.deletePhoto(id)));
    clearSelection();
    await Promise.all([refetchPhotos(), refetchTags()]);
  }

  async function handleDialogDone() {
    setDialog(null);
    clearSelection();
    await Promise.all([refetchPhotos(), refetchTags()]);
  }

  return (
    <div className="app-layout app-layout--topnav">
      <TopNav tags={tags} activeTagId={activeTagId} onSelectTag={handleSelectTag} />

      <main className="main-content">
        <Toolbar
          title={activeTag ? `📁 ${activeTag.name}` : '전체 사진'}
          photoCount={photos.length}
          onUpload={handleUpload}
          uploading={uploading}
          onAssignTag={() => setDialog('assign')}
          onCollage={() => setDialog('collage')}
          onDeleteSelected={handleDeleteSelected}
          onMerge={activeTag ? () => setDialog('merge') : undefined}
          onSlideshow={activeTag ? () => setDialog('slideshow') : undefined}
        />

        <GalleryView photos={photos} loading={loading} />
      </main>

      {dialog === 'assign' && (
        <TagAssignDialog
          photoIds={[...selectedIds]}
          tags={tags}
          onClose={() => setDialog(null)}
          onDone={handleDialogDone}
        />
      )}

      {dialog === 'collage' && <CollageModal photos={selectedPhotos} onClose={() => setDialog(null)} />}

      {dialog === 'merge' && activeTag && (
        <MergeFoldersDialog
          currentTag={activeTag}
          otherTags={tags.filter((t) => t.id !== activeTag.id)}
          onClose={() => setDialog(null)}
          onDone={handleDialogDone}
        />
      )}

      {dialog === 'slideshow' && activeTag && <SlideshowModal photos={photos} onClose={() => setDialog(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <SelectionProvider>
      <GalleryApp />
    </SelectionProvider>
  );
}
