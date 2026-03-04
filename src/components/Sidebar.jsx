import { useState } from 'react';
import { STYLE_OPTIONS, COLOR_SWATCHES } from '../lib/posterRenderer';

function UploadZone({ id, icon, label, image, onChange }) {
    return (
        <div className="upload-zone" id={id}>
            <input type="file" accept="image/*" onChange={onChange} />
            {image
                ? <img className="preview-img" src={image.src} alt="preview" />
                : <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{icon}</span>
            }
            <p>{label}</p>
        </div>
    );
}

function ResultItem({ title, meta, onClick }) {
    return (
        <div className="result-item" onClick={onClick}>
            <div className="r-title">{title}</div>
            {meta && <div className="r-meta">{meta}</div>}
        </div>
    );
}

function ImageTransformControls({ label, transform, onChange }) {
    if (!transform) return null;
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 8, marginTop: -4, marginBottom: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ fontSize: 10, marginBottom: 12, display: 'block', color: 'var(--accent)' }}>{label}</label>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, marginBottom: 4, display: 'block' }}>Pan X</label>
                    <input type="range" min="0" max="1" step="0.01" value={transform.x}
                        onChange={e => onChange({ ...transform, x: parseFloat(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, marginBottom: 4, display: 'block' }}>Pan Y</label>
                    <input type="range" min="0" max="1" step="0.01" value={transform.y}
                        onChange={e => onChange({ ...transform, y: parseFloat(e.target.value) })} />
                </div>
            </div>
            <div>
                <label style={{ fontSize: 9, marginBottom: 4, display: 'block' }}>Zoom / Scale</label>
                <input type="range" min="0.5" max="3" step="0.05" value={transform.scale}
                    onChange={e => onChange({ ...transform, scale: parseFloat(e.target.value) })} />
            </div>
        </div>
    );
}

export default function Sidebar({
    state,
    status,
    loading,
    onImageUpload,
    onFieldChange,
    onStyleChange,
    onAccentChange,
    onFormatChange,
    onRender,
}) {
    return (
        <aside className="sidebar">

            {/* CONTENT SECTION */}
            <div>
                <div className="section-label">Content</div>
                <div className="field-group">
                    <label>Main Title</label>
                    <textarea
                        id="headline"
                        rows={4}
                        value={state.headline}
                        onChange={e => onFieldChange('headline', e.target.value)}
                        placeholder="*MANCHESTER CITY* IN DANGER OF RELEGATION FROM THE EPL"
                    />
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: -2, marginBottom: 6 }}>
                        Tip: Wrap words in *asterisks* to highlight them in color.
                    </p>
                    <label>Subtext (optional)</label>
                    <input
                        type="text"
                        id="subtext"
                        value={state.subtext}
                        onChange={e => onFieldChange('subtext', e.target.value)}
                        placeholder="Club sits 15th after 8 consecutive losses"
                    />
                    <label>Brand Name Watermark</label>
                    <input
                        type="text"
                        id="brand-name"
                        value={state.brandName}
                        onChange={e => onFieldChange('brandName', e.target.value)}
                        placeholder="FAROLS"
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* IMAGES SECTION */}
            <div>
                <div className="section-label">Images</div>
                <div className="field-group">
                    <label>Main Image</label>
                    <UploadZone
                        id="bg-zone"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>}
                        label="Drop or click to upload"
                        image={state.bgImage}
                        onChange={e => onImageUpload(e.target.files[0], 'bg')}
                    />
                    {state.bgImage && (
                        <ImageTransformControls
                            label="Main Image Tracking"
                            transform={state.bgTransform}
                            onChange={t => onFieldChange('bgTransform', t)}
                        />
                    )}

                    <label style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Thumbnail / Context Image
                        {state.thumbImage && (
                            <button
                                onClick={() => onFieldChange('thumbImage', null)}
                                style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff8888', padding: '4px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 4 }}
                            >
                                ✕ Remove
                            </button>
                        )}
                    </label>
                    <UploadZone
                        id="thumb-zone"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                        label="Drop or click to upload"
                        image={state.thumbImage}
                        onChange={e => onImageUpload(e.target.files[0], 'thumb')}
                    />
                    {state.thumbImage && (
                        <ImageTransformControls
                            label="Thumbnail Tracking"
                            transform={state.thumbTransform}
                            onChange={t => onFieldChange('thumbTransform', t)}
                        />
                    )}

                    <label style={{ marginTop: 8 }}>Logo File (Optional)</label>
                    <UploadZone
                        id="logo-zone"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" x2="8" y1="8" y2="16" /></svg>}
                        label="Upload PNG with transparency"
                        image={state.logoImage}
                        onChange={e => onImageUpload(e.target.files[0], 'logo')}
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* DESIGN SECTION */}
            <div>
                <div className="section-label">Design</div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ margin: 0 }}>Dark Filters (Overlay/Gradient)</label>
                        <button
                            onClick={() => onFieldChange('showFilters', state.showFilters === false)}
                            style={{
                                background: state.showFilters !== false ? 'rgba(255,50,50,0.15)' : 'rgba(50,255,50,0.15)',
                                border: `1px solid ${state.showFilters !== false ? 'rgba(255,50,50,0.3)' : 'rgba(50,255,50,0.3)'}`,
                                color: state.showFilters !== false ? '#ff8888' : '#88ff88',
                                padding: '4px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 4
                            }}
                        >
                            {state.showFilters !== false ? '✕ Remove Filters' : '➕ Add Filters'}
                        </button>
                    </div>
                </div>

                <label>Format Options</label>
                <div className="style-grid">
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

                <label style={{ marginTop: 8 }}>Template / Theme</label>
                <div className="style-grid" style={{ marginBottom: 4 }}>
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

                <label style={{ marginTop: 8 }}>Accent Override</label>
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

            {/* STATUS */}
            <div className="status-bar" id="status-bar">
                <div className={`status-dot${status.type ? ` ${status.type}` : ''}`} />
                <span>{status.msg}</span>
            </div>

            {/* RENDER */}
            <button className="btn btn-primary" onClick={onRender} disabled={loading}>
                ⚡ Render Poster
            </button>

        </aside >
    );
}
