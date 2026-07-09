import { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import * as tagsApi from '../../api/tags.api.js';

export function TagAssignDialog({ photoIds, tags, onClose, onDone }) {
  const [newTagName, setNewTagName] = useState('');
  const [busyTagId, setBusyTagId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleAddExisting(tagId) {
    setBusyTagId(tagId);
    setError(null);
    try {
      await tagsApi.addPhotosToTag(tagId, photoIds);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyTagId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await tagsApi.createTag(newTagName.trim(), photoIds);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal title={`태그 지정 (${photoIds.length}장)`} onClose={onClose}>
      <form className="tag-create-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="새 태그 이름"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={creating || !newTagName.trim()}>
          새 태그로 만들기
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      <p className="dialog-subtitle">기존 태그에 추가</p>
      {tags.length === 0 && <p className="dialog-empty">기존 태그가 없습니다</p>}
      <ul className="tag-pick-list">
        {tags.map((tag) => (
          <li key={tag.id}>
            <span>
              {tag.name} <small>({tag.photoCount})</small>
            </span>
            <button className="btn" disabled={busyTagId === tag.id} onClick={() => handleAddExisting(tag.id)}>
              추가
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
