import { useCallback, useEffect, useRef, useState } from 'react';
import { TRANSITIONS } from './transitionRegistry.js';
import { TransitionEffectPicker } from './TransitionEffectPicker.jsx';
import './transitions/transitions.css';

const AUTOPLAY_INTERVAL_MS = 3500;

export function SlideshowModal({ photos, onClose }) {
  const [index, setIndex] = useState(0);
  const [effect, setEffect] = useState('fade');
  const [animClass, setAnimClass] = useState('');
  const [playing, setPlaying] = useState(true);
  const outTimeoutRef = useRef(null);
  const inTimeoutRef = useRef(null);

  const goTo = useCallback(
    (direction) => {
      if (photos.length <= 1) return;
      const config = TRANSITIONS[effect];
      clearTimeout(outTimeoutRef.current);
      clearTimeout(inTimeoutRef.current);
      setAnimClass(`${effect}-out`);
      outTimeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + direction + photos.length) % photos.length);
        setAnimClass(`${effect}-in`);
        inTimeoutRef.current = setTimeout(() => setAnimClass(''), config.duration);
      }, config.duration);
    },
    [effect, photos.length]
  );

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const id = setInterval(() => goTo(1), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, goTo, photos.length]);

  useEffect(() => {
    return () => {
      clearTimeout(outTimeoutRef.current);
      clearTimeout(inTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goTo(1);
      else if (e.key === 'ArrowLeft') goTo(-1);
      else if (e.key === ' ') setPlaying((p) => !p);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goTo, onClose]);

  if (photos.length === 0) {
    return (
      <div className="slideshow-overlay" onClick={onClose}>
        <p className="empty-state">이 폴더에는 사진이 없습니다.</p>
      </div>
    );
  }

  const photo = photos[index];

  return (
    <div className="slideshow-overlay">
      <button className="slideshow-close" onClick={onClose} aria-label="닫기">
        ✕
      </button>

      <div className="slideshow-stage">
        <img key={photo.id} src={photo.url} alt={photo.originalName} className={`slide-image ${animClass}`} />
      </div>

      <div className="slideshow-controls">
        <button className="btn" onClick={() => goTo(-1)}>
          ‹ 이전
        </button>
        <button className="btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        <button className="btn" onClick={() => goTo(1)}>
          다음 ›
        </button>
        <TransitionEffectPicker value={effect} onChange={setEffect} />
        <span className="slideshow-index">
          {index + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}
