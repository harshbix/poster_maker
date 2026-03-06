import { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { CanvasAreaWithRef } from './components/CanvasArea';
import { usePosterState } from './hooks/usePosterState';
import './index.css';

export default function App() {
  const {
    state, stateRef,
    set, update,
    setRenderFn,
    addMultipleImages, removeImage,
    shuffle, setLayoutLabel,
  } = usePosterState();

  const canvasRef = useRef(null);
  const [status, setStatus] = useState({ msg: 'Drop images and hit Shuffle to begin', type: '' });
  const setStatusMsg = useCallback((msg, type = '') => setStatus({ msg, type }), []);

  // CanvasArea registers its stable render fn here once on mount
  const handleRenderReady = useCallback((renderFn) => {
    setRenderFn(renderFn);
    requestAnimationFrame(() => renderFn(stateRef.current));
  }, [setRenderFn, stateRef]);

  // ── Text fields: update globally and trigger canvas repaint ──
  const handleFieldChange = useCallback((field, value) => update({ [field]: value }), [update]);

  // ── These trigger canvas repaints immediately ──
  const handleStyleChange = useCallback((s) => update({ style: s }), [update]);
  const handleAccentChange = useCallback((c) => update({ accentColor: c }), [update]);
  const handleFormatChange = useCallback((f) => update({ format: f }), [update]);
  const handleFiles = useCallback((files) => addMultipleImages(files), [addMultipleImages]);
  const handleRemoveImage = useCallback((id) => removeImage(id), [removeImage]);

  const handleShuffle = useCallback(() => {
    setStatusMsg('Shuffling…', 'active');
    shuffle();
  }, [shuffle, setStatusMsg]);

  const handleDownload = useCallback(() => canvasRef.current?.download(), []);

  return (
    <>
      <Header />
      <div className="workspace">
        <Sidebar
          state={state}
          status={status}
          onFiles={handleFiles}
          onRemoveImage={handleRemoveImage}
          onFieldChange={handleFieldChange}
          onStyleChange={handleStyleChange}
          onAccentChange={handleAccentChange}
          onFormatChange={handleFormatChange}
          onShuffle={handleShuffle}
          onDownload={handleDownload}
        />
        <CanvasAreaWithRef
          ref={canvasRef}
          state={state}
          onStatusUpdate={setStatusMsg}
          onLayoutLabel={setLayoutLabel}
          onRenderReady={handleRenderReady}
        />
      </div>
    </>
  );
}
