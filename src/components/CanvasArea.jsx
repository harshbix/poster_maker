import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { renderPoster } from '../lib/posterRenderer';
import { WORKSPACE_COPY } from '../config/appConfig';

export const CanvasAreaWithRef = forwardRef(function CanvasAreaWithRef(props, ref) {
    const { state, formatLabel, formatDescription, onStatusUpdate, onLayoutLabel, onRenderReady } = props;

    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const onStatusUpdateRef = useRef(onStatusUpdate);
    const onLayoutLabelRef = useRef(onLayoutLabel);
    const latestStateRef = useRef(state);
    const [layoutLabel, setLayoutLabel] = useState('');

    useEffect(() => {
        latestStateRef.current = state;
    }, [state]);

    useEffect(() => {
        onStatusUpdateRef.current = onStatusUpdate;
    }, [onStatusUpdate]);

    useEffect(() => {
        onLayoutLabelRef.current = onLayoutLabel;
    }, [onLayoutLabel]);

    const scaleCanvas = useCallback((canvas) => {
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        const maxH = window.innerHeight * 0.72;
        const maxW = (wrapper?.parentElement?.clientWidth ?? 760) - 48;
        const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    }, []);

    const stableRender = useCallback((freshState) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const wrapper = canvas.parentElement;
            if (wrapper) {
                wrapper.classList.remove('shuffling');
                void wrapper.offsetWidth;
                wrapper.classList.add('shuffling');
            }

            const result = renderPoster({ canvas, state: freshState });
            scaleCanvas(canvas);

            const label = result?.layout?.label || '';
            setLayoutLabel(label);
            onLayoutLabelRef.current?.(label);
            onStatusUpdateRef.current?.(label ? `Layout ready: ${label}` : 'Preview updated.', 'success');
        });
    }, [scaleCanvas]);

    const stableDownload = useCallback((brandName) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const safeBrand = (brandName || 'poster')
            .trim()
            .replace(/[^\w-]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'poster';

        link.download = `${safeBrand}_${date}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onStatusUpdateRef.current?.('PNG downloaded.', 'success');
    }, []);

    useEffect(() => {
        onRenderReady?.(stableRender);
    }, [onRenderReady, stableRender]);

    useImperativeHandle(ref, () => ({
        download: () => stableDownload(latestStateRef.current?.brandName),
    }), [stableDownload]);

    useEffect(() => {
        const handleResize = () => scaleCanvas(canvasRef.current);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [scaleCanvas]);

    const isEmpty = state.images.length === 0 && !state.headline.trim() && !state.subtext.trim();

    return (
        <main className="canvas-area" aria-label="Poster preview workspace">
            <div className="canvas-top-bar">
                <div>
                    <div className="preview-label">Live Preview</div>
                    <div className="preview-meta">{formatLabel} canvas · {formatDescription}</div>
                </div>
                {layoutLabel && (
                    <div className="layout-chip">{layoutLabel}</div>
                )}
            </div>

            <section className="preview-stage">
                <div id="poster-wrapper" className="poster-wrapper">
                    <canvas
                        id="poster-canvas"
                        ref={canvasRef}
                        width={1080}
                        height={state.format === 'story' ? 1920 : 1080}
                    />
                    {layoutLabel && (
                        <div className="layout-badge">{layoutLabel}</div>
                    )}
                    {isEmpty && (
                        <div className="empty-preview-state">
                            <div className="empty-preview-title">Your poster preview will appear here.</div>
                            <div className="empty-preview-copy">Add a headline, upload images, then shuffle layouts to explore compositions.</div>
                        </div>
                    )}
                </div>
            </section>

            <div className="canvas-hint">
                {isEmpty ? WORKSPACE_COPY.previewEmpty : WORKSPACE_COPY.previewReady}
            </div>
        </main>
    );
});

export default CanvasAreaWithRef;
