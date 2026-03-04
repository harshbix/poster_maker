import { useRef, useEffect, useCallback } from 'react';
import { renderPoster } from '../lib/posterRenderer';

export default function CanvasArea({ state, onFormatSwitch, onStatusUpdate }) {

    const canvasRef = useRef(null);

    const doRender = useCallback(() => {
        if (!canvasRef.current) return;
        renderPoster({ canvas: canvasRef.current, state });
        onStatusUpdate('Poster rendered — ready to download', 'success');

        // Scale for display
        const canvas = canvasRef.current;
        const W = canvas.width;
        const H = canvas.height;
        const wrapper = canvas.parentElement;
        const maxH = window.innerHeight * 0.65;
        const maxW = wrapper?.parentElement?.clientWidth - 64 || 600;
        const scale = Math.min(maxW / W, maxH / H, 1);
        canvas.style.width = `${W * scale}px`;
        canvas.style.height = `${H * scale}px`;
    }, [state, onStatusUpdate]);

    // Re-render when relevant state changes
    useEffect(() => {
        if (state.rendered) doRender();
    }, [state.style, state.accentColor, state.format, state.bgTransform, state.thumbTransform, doRender, state.rendered]);

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const brand = (state.brandName || 'poster').replace(/\s+/g, '_');
        link.download = `${brand}_${date}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        onStatusUpdate('Downloaded!', 'success');
    };

    return (
        <main className="canvas-area">
            <div style={{
                display: 'flex', gap: 16, alignItems: 'center',
                flexWrap: 'wrap', justifyContent: 'space-between',
                width: '100%', maxWidth: 540,
            }}>
                <div style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: 12,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                }}>
                    Preview
                </div>
                <div className="format-tabs">
                    {['square', 'story'].map(fmt => (
                        <button
                            key={fmt}
                            className={`format-tab${state.format === fmt ? ' active' : ''}`}
                            onClick={() => onFormatSwitch(fmt)}
                        >
                            {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div id="poster-wrapper">
                <canvas
                    id="poster-canvas"
                    ref={canvasRef}
                    width={1080}
                    height={state.format === 'story' ? 1920 : 1080}
                />
            </div>

            <div className="export-row">
                <button className="btn btn-primary" onClick={download} style={{ flex: 1 }}>
                    ⬇ Download PNG
                </button>
            </div>

            <div style={{
                fontSize: 11,
                color: 'var(--muted)',
                textAlign: 'center',
                lineHeight: 1.7,
                maxWidth: 400,
            }}>
                Renders at full 1080px resolution. Download for Instagram, TikTok, Twitter, or any social platform.
            </div>
        </main>
    );
}

// Expose doRender via forwardRef
import { forwardRef, useImperativeHandle } from 'react';

const CanvasAreaWithRef = forwardRef(function CanvasAreaRef(props, ref) {
    const canvasRef = useRef(null);
    const { state, onFormatSwitch, onStatusUpdate } = props;

    const doRender = useCallback(() => {
        if (!canvasRef.current) return;
        renderPoster({ canvas: canvasRef.current, state });
        onStatusUpdate('Poster rendered — ready to download', 'success');

        const canvas = canvasRef.current;
        const W = canvas.width;
        const H = canvas.height;
        const wrapper = canvas.parentElement;
        const maxH = window.innerHeight * 0.65;
        const maxW = (wrapper?.parentElement?.clientWidth ?? 600) - 64;
        const scale = Math.min(maxW / W, maxH / H, 1);
        canvas.style.width = `${W * scale}px`;
        canvas.style.height = `${H * scale}px`;
    }, [state, onStatusUpdate]);

    useImperativeHandle(ref, () => ({ render: doRender }), [doRender]);

    useEffect(() => {
        if (state.rendered) doRender();
    }, [state.style, state.accentColor, state.format, state.bgTransform, state.thumbTransform, doRender, state.rendered]);

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const brand = (state.brandName || 'poster').replace(/\s+/g, '_');
        link.download = `${brand}_${date}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        onStatusUpdate('Downloaded!', 'success');
    };

    return (
        <main className="canvas-area">
            <div style={{
                display: 'flex', gap: 16, alignItems: 'center',
                flexWrap: 'wrap', justifyContent: 'space-between',
                width: '100%', maxWidth: 540,
            }}>
                <div style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: 12,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                }}>
                    Preview
                </div>
                <div className="format-tabs">
                    {['square', 'story'].map(fmt => (
                        <button
                            key={fmt}
                            className={`format-tab${state.format === fmt ? ' active' : ''}`}
                            onClick={() => onFormatSwitch(fmt)}
                        >
                            {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div id="poster-wrapper">
                <canvas
                    id="poster-canvas"
                    ref={canvasRef}
                    width={1080}
                    height={state.format === 'story' ? 1920 : 1080}
                />
            </div>

            <div className="export-row">
                <button className="btn btn-primary" onClick={download} style={{ flex: 1 }}>
                    ⬇ Download PNG
                </button>
            </div>

            <div style={{
                fontSize: 11, color: 'var(--muted)', textAlign: 'center',
                lineHeight: 1.7, maxWidth: 400,
            }}>
                Renders at full 1080px resolution. Download for Instagram, TikTok, Twitter, or any social platform.
            </div>
        </main>
    );
});

export { CanvasAreaWithRef };
