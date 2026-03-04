import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { CanvasAreaWithRef } from './components/CanvasArea';
import LoadingOverlay from './components/LoadingOverlay';
import { usePosterState } from './hooks/usePosterState';
import { renderPoster } from './lib/posterRenderer';
import './index.css';

export default function App() {
  const { state, update, loadImageFromFile } = usePosterState();
  const [status, setStatus] = useState({ msg: 'Ready — fill in details and render', type: '' });
  const [loading, setLoading] = useState(false);
  const [loader, setLoader] = useState({ title: '', sub: '' });

  const canvasRef = useRef(null);

  const setStatusMsg = useCallback((msg, type = '') => {
    setStatus({ msg, type });
  }, []);

  const showLoader = (title, sub) => {
    setLoader({ title, sub });
    setLoading(true);
  };

  const hideLoader = () => setLoading(false);

  // Initial render on mount
  useEffect(() => {
    // small delay so DOM is ready
    const t = setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.render();
        update({ rendered: true });
      }
    }, 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle render
  const handleRender = useCallback(() => {
    if (!canvasRef.current) return;
    setStatusMsg('Rendering...', 'active');

    // Small timeout to let state settle
    setTimeout(() => {
      const canvas = document.getElementById('poster-canvas');
      if (!canvas) return;
      renderPoster({ canvas, state });

      // Scale for display
      const W = canvas.width;
      const H = canvas.height;
      const wrapper = canvas.parentElement;
      const maxH = window.innerHeight * 0.65;
      const maxW = (wrapper?.parentElement?.clientWidth ?? 600) - 64;
      const scale = Math.min(maxW / W, maxH / H, 1);
      canvas.style.width = `${W * scale}px`;
      canvas.style.height = `${H * scale}px`;

      update({ rendered: true });
      setStatusMsg('Poster rendered — ready to download', 'success');
    }, 50);
  }, [state, update, setStatusMsg]);

  const handleImageUpload = (file, type) => {
    loadImageFromFile(file, type);
    setStatusMsg('Image loaded — render when ready', '');
  };

  const handleFieldChange = (field, value) => {
    update({ [field]: value });
  };

  const handleStyleChange = (style) => {
    update({ style });
  };

  const handleAccentChange = (color) => {
    update({ accentColor: color });
  };

  const handleFormatChange = (format) => {
    update({ format });
  };

  return (
    <>
      <Header />
      <div className="workspace">
        <Sidebar
          state={state}
          status={status}
          loading={loading}
          onImageUpload={handleImageUpload}
          onFieldChange={handleFieldChange}
          onStyleChange={handleStyleChange}
          onAccentChange={handleAccentChange}
          onFormatChange={handleFormatChange}
          onRender={handleRender}
        />
        <CanvasAreaWithRef
          ref={canvasRef}
          state={state}
          onFormatSwitch={handleFormatChange}
          onStatusUpdate={setStatusMsg}
        />
      </div>
      <LoadingOverlay show={loading} title={loader.title} sub={loader.sub} />
    </>
  );
}
