import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import ToastRegion from './components/ToastRegion';
import { CanvasAreaWithRef } from './components/CanvasArea';
import { usePosterState } from './hooks/usePosterState';
import { DEFAULT_STATUS, FORMAT_OPTIONS, TOAST_TIMEOUT_MS } from './config/appConfig';
import './index.css';

export default function App() {
  const {
    state,
    stateRef,
    update,
    setRenderFn,
    addMultipleImages,
    removeImage,
    updateImageAdjustments,
    resetImageAdjustments,
    shuffle,
    setLayoutLabel,
  } = usePosterState();

  const canvasRef = useRef(null);
  const toastIdRef = useRef(0);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [toasts, setToasts] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const showToast = useCallback((title, message = '', type = 'info') => {
    const id = `toast_${++toastIdRef.current}`;
    setToasts((current) => [...current, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_TIMEOUT_MS);
  }, []);

  const setStatusMsg = useCallback((msg, type = '') => {
    setStatus({ msg, type });
  }, []);

  const handleRenderReady = useCallback((renderFn) => {
    setRenderFn(renderFn);
    setIsCanvasReady(true);
    requestAnimationFrame(() => renderFn(stateRef.current));
  }, [setRenderFn, stateRef]);

  const selectedImage = useMemo(
    () => state.images.find((image) => image.id === selectedImageId) ?? state.images[0] ?? null,
    [selectedImageId, state.images],
  );

  const currentFormat = useMemo(
    () => FORMAT_OPTIONS.find((option) => option.id === state.format) ?? FORMAT_OPTIONS[0],
    [state.format],
  );

  useEffect(() => {
    if (state.images.length === 0) {
      setSelectedImageId(null);
      return;
    }

    if (!selectedImageId || !state.images.some((image) => image.id === selectedImageId)) {
      setSelectedImageId(state.images[0].id);
    }
  }, [selectedImageId, state.images]);

  const handleFieldChange = useCallback((field, value) => update({ [field]: value }), [update]);
  const handleStyleChange = useCallback((style) => update({ style }), [update]);
  const handleAccentChange = useCallback((accentColor) => update({ accentColor }), [update]);
  const handleFormatChange = useCallback((format) => {
    update({ format });
    const formatOption = FORMAT_OPTIONS.find((option) => option.id === format);
    if (formatOption) {
      showToast('Canvas updated', formatOption.description, 'success');
    }
  }, [showToast, update]);

  const handleRemoveImage = useCallback((id) => {
    const image = state.images.find((item) => item.id === id);
    removeImage(id);
    setStatusMsg('Image removed. Poster updated.', 'success');
    showToast('Image removed', image?.name || 'The selected image was removed.', 'success');
  }, [removeImage, setStatusMsg, showToast, state.images]);

  const handleFiles = useCallback(async (files) => {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      setStatusMsg('No files were selected.', 'error');
      showToast('No files selected', 'Choose one or more images to continue.', 'error');
      return;
    }

    setIsImporting(true);
    setStatusMsg(
      selectedFiles.length === 1 ? 'Importing image...' : `Importing ${selectedFiles.length} images...`,
      'active',
    );

    try {
      const result = await addMultipleImages(selectedFiles);

      if (result.added.length > 0) {
        setSelectedImageId(result.added[0].id);
      }

      if (result.added.length > 0 && result.errors.length === 0) {
        const message = result.added.length === 1
          ? '1 image added. Poster refreshed.'
          : `${result.added.length} images added. Poster refreshed.`;
        setStatusMsg(message, 'success');
        showToast('Images added', `${result.added.length} image${result.added.length === 1 ? '' : 's'} are ready to use.`, 'success');
        return;
      }

      if (result.added.length > 0 && result.errors.length > 0) {
        setStatusMsg(
          `${result.added.length} image${result.added.length === 1 ? '' : 's'} added. ${result.errors.length} file${result.errors.length === 1 ? '' : 's'} skipped.`,
          'error',
        );
        showToast('Some files were skipped', result.errors[0], 'error');
        return;
      }

      const errorMessage = result.errors[0] || 'No valid images were added.';
      setStatusMsg(errorMessage, 'error');
      showToast('Import failed', errorMessage, 'error');
    } catch (error) {
      const message = error.message || 'Image import failed.';
      setStatusMsg(message, 'error');
      showToast('Import failed', message, 'error');
    } finally {
      setIsImporting(false);
    }
  }, [addMultipleImages, setStatusMsg, showToast]);

  const handleShuffle = useCallback(() => {
    if (!state.images.length && !state.headline.trim()) {
      setStatusMsg('Add a headline or upload an image before shuffling.', 'error');
      showToast('Nothing to shuffle yet', 'Add content first so the layout engine has something to work with.', 'error');
      return;
    }

    setStatusMsg('Trying a new layout...', 'active');
    shuffle();
  }, [shuffle, setStatusMsg, showToast, state.headline, state.images.length]);

  const handleDownload = useCallback(() => {
    if (!isCanvasReady) {
      setStatusMsg('Preview is still getting ready. Try again in a moment.', 'error');
      showToast('Preview not ready', 'Wait a moment for the canvas to finish rendering.', 'error');
      return;
    }

    canvasRef.current?.download();
    showToast('Export started', 'Your PNG export has been prepared.', 'success');
  }, [isCanvasReady, setStatusMsg, showToast]);

  const handleSelectImage = useCallback((id) => {
    setSelectedImageId(id);
    const image = state.images.find((item) => item.id === id);
    setStatusMsg(`Editing framing for ${image?.name || 'selected image'}.`, 'active');
  }, [setStatusMsg, state.images]);

  const handleImageAdjust = useCallback((id, patch) => {
    updateImageAdjustments(id, patch);
  }, [updateImageAdjustments]);

  const handleImageReset = useCallback((id) => {
    resetImageAdjustments(id);
    setStatusMsg('Image framing reset.', 'success');
    showToast('Framing reset', 'The selected image is back to its default crop.', 'success');
  }, [resetImageAdjustments, setStatusMsg, showToast]);

  return (
    <>
      <Header formatLabel={currentFormat.label} imageCount={state.images.length} />
      <div className="workspace">
        <Sidebar
          state={state}
          status={status}
          isImporting={isImporting}
          canDownload={isCanvasReady}
          selectedImageId={selectedImage?.id ?? null}
          selectedImage={selectedImage}
          onFiles={handleFiles}
          onRemoveImage={handleRemoveImage}
          onSelectImage={handleSelectImage}
          onImageAdjust={handleImageAdjust}
          onImageReset={handleImageReset}
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
          formatLabel={currentFormat.label}
          formatDescription={currentFormat.description}
          onStatusUpdate={setStatusMsg}
          onLayoutLabel={setLayoutLabel}
          onRenderReady={handleRenderReady}
        />
      </div>
      <LoadingOverlay
        show={isImporting}
        title="Preparing images"
        sub="Validating files and updating the poster preview."
      />
      <ToastRegion toasts={toasts} />
    </>
  );
}
