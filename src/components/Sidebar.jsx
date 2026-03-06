import { useState, useRef, useCallback } from 'react';
import { STYLE_OPTIONS, COLOR_SWATCHES } from '../lib/posterRenderer';
import { INITIAL_STATE } from '../hooks/usePosterState';

// ---- Image Thumbnail Chip ---- //
function ImageChip({ item, onRemove }) {
    return (
        <div className="img-chip">
            <img src={item.src} alt="uploaded" className="img-chip-thumb" />
            <button className="img-chip-remove" onClick={() => onRemove(item.id)} title="Remove">✕</button>
        </div>
    );
}

// ---- Upload Drop Zone ---- //
function DropZone({ onFiles }) {
    const inputRef = useRef(null);
    const [over, setOver] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) onFiles(files);
    };

    return (
        <div
            className={`drop-zone${over ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => onFiles(e.target.files)}
            />
            <div className="drop-zone-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
            </div>
            <p className="drop-zone-label">Drop images here or <span>click to browse</span></p>
            <p className="drop-zone-sub">Add as many as you want — PNG, JPG, WebP</p>
        </div>
    );
}

// ---- Main Sidebar ---- //
export default function Sidebar({
    state,
    status,
    onFiles,
    onRemoveImage,
    onFieldChange,
    onStyleChange,
    onAccentChange,
    onFormatChange,
    onShuffle,
    onDownload,
}) {
    const hasImages = state.images.length > 0;

    return (
        <aside className="sidebar">

            {/* ── SHUFFLE BUTTON (TOP CTA) ── */}
            <button
                id="btn-shuffle"
                className="btn btn-shuffle"
                onClick={onShuffle}
                disabled={!hasImages && !state.headline}
            >
                <span className="shuffle-icon">⟳</span>
                Shuffle Layout
            </button>

            {/* ── IMAGES ── */}
            <div>
                <div className="section-label">Images</div>

                {state.images.length > 0 && (
                    <div className="img-chip-grid">
                        {state.images.map(item => (
                            <ImageChip key={item.id} item={item} onRemove={onRemoveImage} />
                        ))}
                    </div>
                )}

                <DropZone onFiles={onFiles} />

                {state.images.length > 0 && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                        {state.images.length} image{state.images.length > 1 ? 's' : ''} loaded. First image is the hero. Hit Shuffle to rearrange.
                    </p>
                )}
            </div>

            <hr className="divider" />

            {/* ── CONTENT ── */}
            <div>
                <div className="section-label">Content</div>
                <div className="field-group">
                    <label>Main Title</label>
                    <textarea
                        id="headline"
                        rows={3}
                        value={state.headline}
                        onChange={e => onFieldChange('headline', e.target.value)}
                        onFocus={() => { if (state.headline === INITIAL_STATE.headline) onFieldChange('headline', ''); }}
                        placeholder="*MANCHESTER CITY* IN DANGER OF RELEGATION FROM THE EPL"
                    />
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: -2, marginBottom: 4, lineHeight: 1.5 }}>
                        Wrap words in *asterisks* to highlight them in the accent color.
                    </p>

                    <label>Subtext (optional)</label>
                    <input
                        type="text"
                        id="subtext"
                        value={state.subtext}
                        onChange={e => onFieldChange('subtext', e.target.value)}
                        onFocus={() => { if (state.subtext === INITIAL_STATE.subtext) onFieldChange('subtext', ''); }}
                        placeholder="Club sits 15th after 8 consecutive losses"
                    />

                    <label>Brand Name</label>
                    <input
                        type="text"
                        id="brand-name"
                        value={state.brandName}
                        onChange={e => onFieldChange('brandName', e.target.value)}
                        onFocus={() => { if (state.brandName === INITIAL_STATE.brandName) onFieldChange('brandName', ''); }}
                        placeholder="FAROLS"
                    />

                    <label>Badge Label</label>
                    <input
                        type="text"
                        id="custom-badge"
                        value={state.customBadge || ''}
                        onChange={e => onFieldChange('customBadge', e.target.value)}
                        onFocus={() => { if (state.customBadge === INITIAL_STATE.customBadge) onFieldChange('customBadge', ''); }}
                        placeholder="NEWS"
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* ── DESIGN ── */}
            <div>
                <div className="section-label">Design</div>

                <label>Format</label>
                <div className="style-grid" style={{ marginBottom: 16 }}>
                    {[
                        { id: 'square', label: 'Square', sub: '1080 × 1080' },
                        { id: 'story', label: 'Story', sub: '1080 × 1920' },
                    ].map(f => (
                        <div
                            key={f.id}
                            className={`style-card${state.format === f.id ? ' active' : ''}`}
                            onClick={() => onFormatChange(f.id)}
                        >
                            <div className="style-name">{f.label}</div>
                            <div className="style-sub">{f.sub}</div>
                        </div>
                    ))}
                </div>

                <label>Theme</label>
                <div className="style-grid" style={{ marginBottom: 16 }}>
                    {STYLE_OPTIONS.map(s => (
                        <div
                            key={s.id}
                            className={`style-card${state.style === s.id ? ' active' : ''}`}
                            onClick={() => onStyleChange(s.id)}
                        >
                            <div className="style-name" style={{ color: s.color }}>{s.label}</div>
                            <div className="style-sub">{s.sub}</div>
                        </div>
                    ))}
                </div>

                <label>Accent Color</label>
                <div className="color-row">
                    {COLOR_SWATCHES.map(color => (
                        <div
                            key={color}
                            className={`color-swatch${state.accentColor === color ? ' active' : ''}`}
                            style={{ background: color }}
                            onClick={() => onAccentChange(color)}
                        />
                    ))}
                </div>
            </div>

            <hr className="divider" />

            {/* ── STATUS ── */}
            <div className="status-bar" id="status-bar">
                <div className={`status-dot${status.type ? ` ${status.type}` : ''}`} />
                <span>{status.msg || (state.currentLayoutLabel ? `Layout: ${state.currentLayoutLabel}` : 'Upload images and hit Shuffle')}</span>
            </div>

            {/* ── DOWNLOAD ── */}
            <button className="btn btn-secondary" onClick={onDownload}>
                ⬇ Download PNG
            </button>

        </aside>
    );
}
