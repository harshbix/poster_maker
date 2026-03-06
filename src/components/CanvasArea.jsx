import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { renderPoster } from '../lib/posterRenderer';

// ============================================================
// CanvasAreaWithRef — Imperative, event-driven canvas renderer
//
// The canvas is painted via a stable `stableRender(freshState)` fn
// registered once on mount (via onRenderReady).
// usePosterState holds this fn and calls it directly on every event.
// Zero React re-render cycle for canvas updates.
// ============================================================

export const CanvasAreaWithRef = forwardRef(function CanvasAreaWithRef(props, ref) {
    const { state, onStatusUpdate, onLayoutLabel, onRenderReady } = props;

    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const onStatusUpdateRef = useRef(onStatusUpdate);
    const onLayoutLabelRef = useRef(onLayoutLabel);
    const [layoutLabel, setLayoutLabel] = useState('');

    // Keep callback refs current so stableRender never closes over stale fns
    useEffect(() => { onStatusUpdateRef.current = onStatusUpdate; }, [onStatusUpdate]);
    useEffect(() => { onLayoutLabelRef.current = onLayoutLabel; }, [onLayoutLabel]);

    // ── Scale canvas CSS size to fit viewport ──────────────────────────────
    const scaleCanvas = (canvas) => {
        if (!canvas) return;
        const wrapper = canvas.parentElement;
        const maxH = window.innerHeight * 0.72;
        const maxW = (wrapper?.parentElement?.clientWidth ?? 700) - 48;
        const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    };

    // ── STABLE RENDER — created ONCE, called imperatively by usePosterState ──
    // Uses rAF to batch rapid calls (e.g. multiple images loading quickly).
    const stableRender = useCallback((freshState) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Trigger CSS pop animation imperatively
            const wrapper = canvas.parentElement;
            if (wrapper) {
                wrapper.classList.remove('shuffling');
                void wrapper.offsetWidth; // trigger reflow
                wrapper.classList.add('shuffling');
            }

            const result = renderPoster({ canvas, state: freshState });
            scaleCanvas(canvas);

            const label = result?.layout?.label || '';
            setLayoutLabel(label);
            onLayoutLabelRef.current?.(label);
            onStatusUpdateRef.current?.(label ? `Layout: ${label}` : 'Ready', 'success');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // empty deps — intentionally stable forever

    // ── STABLE DOWNLOAD ────────────────────────────────────────────────────
    const stableDownload = useCallback((brandName) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const brand = (brandName || 'poster').replace(/\s+/g, '_');
        link.download = `${brand}_${date}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onStatusUpdateRef.current?.('Downloaded!', 'success');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Register render fn with parent once on mount
    useEffect(() => {
        onRenderReady?.(stableRender);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Expose download via ref (parent calls canvasRef.current.download())
    // We use a latestState ref so download always uses the freshest brandName
    const latestStateRef = useRef(state);
    latestStateRef.current = state;

    useImperativeHandle(ref, () => ({
        download: () => stableDownload(latestStateRef.current?.brandName),
    }), []); // eslint-disable-line react-hooks/exhaustive-deps

    // Resize only on window resize — no re-render of canvas
    useEffect(() => {
        const h = () => scaleCanvas(canvasRef.current);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    return (
        <main className="canvas-area">
            <div className="canvas-top-bar" style={{ justifyContent: 'flex-start' }}>
                <div className="preview-label">Preview</div>
            </div>

            <div id="poster-wrapper">
                <canvas
                    id="poster-canvas"
                    ref={canvasRef}
                    width={1080}
                    height={state.format === 'story' ? 1920 : 1080}
                />
                {layoutLabel && (
                    <div className="layout-badge">{layoutLabel}</div>
                )}
            </div>

            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7, maxWidth: 420 }}>
                Renders at full 1080px. Download for Instagram, TikTok, Twitter or any social platform.
            </div>
        </main>
    );
});

export default CanvasAreaWithRef;
