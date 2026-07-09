import { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import * as tagsApi from '../../api/tags.api.js';

export function MergeFoldersDialog({ currentTag, otherTags, onClose, onDone }) {
  const [selectedOtherIds, setSelectedOtherIds] = useState(() => new Set());
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function toggleOther(id) {
    setSelectedOtherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleMerge(e) {
    e.preventDefault();
    if (selectedOtherIds.size === 0 || !newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const sourceTagIds = [currentTag.id, ...selectedOtherIds];
      await tagsApi.mergeTags(sourceTagIds, newName.trim());
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`"${currentTag.name}" 폴더 병합`} onClose={onClose}>
      <p className="dialog-subtitle">병합할 다른 폴더 선택</p>
      {otherTags.length === 0 && <p className="dialog-empty">병합할 수 있는 다른 폴더가 없습니다</p>}
      <ul className="tag-pick-list">
        {otherTags.map((tag) => (
          <li key={tag.id}>
            <label className="tag-pick-checkbox">
              <input type="checkbox" checked={selectedOtherIds.has(tag.id)} onChange={() => toggleOther(tag.id)} />
              {tag.name} <small>({tag.photoCount})</small>
            </label>
          </li>
        ))}
      </ul>

      <form className="tag-create-form" onSubmit={handleMerge}>
        <input
          type="text"
          placeholder="새 태그(병합 결과) 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || selectedOtherIds.size === 0 || !newName.trim()}>
          병합하기
        </button>
      </form>
      <p className="dialog-hint">병합해도 기존 폴더({currentTag.name} 등)의 태그는 그대로 유지됩니다.</p>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
