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

export default function Sidebar({
    state,
    status,
    loading,
    newsResults,
    aiHeadlines,
    apiKey,
    onApiKeyChange,
    onNewsSearch,
    onSelectNews,
    onAiEnhance,
    onSelectHeadline,
    onImageUpload,
    onFieldChange,
    onStyleChange,
    onAccentChange,
    onFormatChange,
    onRender,
}) {
    const [query, setQuery] = useState('');

    const handleSearch = () => onNewsSearch(query);
    const handleKeyDown = (e) => { if (e.key === 'Enter') onNewsSearch(query); };

    return (
        <aside className="sidebar">

            {/* API KEY */}
            <div className="api-card">
                <div className="api-card-header">
                    <span className="api-card-icon">🔑</span>
                    <span className="api-card-title">Claude API Key</span>
                    <span className={`api-status-pill${apiKey.trim() ? ' connected' : ''}`}>
                        {apiKey.trim() ? '● Connected' : '○ Not set'}
                    </span>
                </div>
                <div className="api-input-wrapper">
                    <span className="api-input-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </span>
                    <input
                        className="api-input"
                        type="password"
                        placeholder="sk-ant-api03-..."
                        value={apiKey}
                        onChange={e => onApiKeyChange(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <p className="api-hint">
                    Powers news search &amp; AI headline generation.{' '}
                    <a href="https://console.anthropic.com/keys" target="_blank" rel="noreferrer" className="api-link">
                        Get a key ↗
                    </a>
                </p>
            </div>

            <hr className="divider" />

            {/* NEWS SEARCH */}
            <div>
                <div className="section-label">Search News Topic</div>
                <div className="field-group">
                    <div className="search-row">
                        <input
                            type="text"
                            id="news-query"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. Manchester City relegation..."
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            GO
                        </button>
                    </div>
                </div>

                {newsResults.length > 0 && (
                    <div className="search-results">
                        {newsResults.map((r, i) => (
                            <ResultItem
                                key={i}
                                title={r.title}
                                meta={`${r.source} · ${r.date}`}
                                onClick={() => onSelectNews(r)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <hr className="divider" />

            {/* HEADLINE */}
            <div>
                <div className="section-label">Headline</div>
                <div className="field-group">
                    <label>Main Title</label>
                    <textarea
                        id="headline"
                        rows={2}
                        value={state.headline}
                        onChange={e => onFieldChange('headline', e.target.value)}
                        placeholder="MANCHESTER CITY IN DANGER OF RELEGATION FROM THE EPL"
                    />
                    <label>Subtext (optional)</label>
                    <input
                        type="text"
                        id="subtext"
                        value={state.subtext}
                        onChange={e => onFieldChange('subtext', e.target.value)}
                        placeholder="Club sits 15th after 8 consecutive losses"
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* IMAGES */}
            <div>
                <div className="section-label">Images</div>
                <div className="field-group">
                    <label>Background / Main Image</label>
                    <UploadZone
                        id="bg-zone"
                        icon="🖼"
                        label="Drop or click to upload"
                        image={state.bgImage}
                        onChange={e => onImageUpload(e.target.files[0], 'bg')}
                    />
                    <label style={{ marginTop: 8 }}>Thumbnail / Person Image (optional)</label>
                    <UploadZone
                        id="thumb-zone"
                        icon="👤"
                        label="Drop or click to upload"
                        image={state.thumbImage}
                        onChange={e => onImageUpload(e.target.files[0], 'thumb')}
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* LOGO */}
            <div>
                <div className="section-label">Your Logo / Watermark</div>
                <div className="field-group">
                    <UploadZone
                        id="logo-zone"
                        icon="©"
                        label="Upload your logo (PNG with transparency preferred)"
                        image={state.logoImage}
                        onChange={e => onImageUpload(e.target.files[0], 'logo')}
                    />
                    <label>Or type brand name</label>
                    <input
                        type="text"
                        id="brand-name"
                        value={state.brandName}
                        onChange={e => onFieldChange('brandName', e.target.value)}
                        placeholder="ANTIGRAVITY"
                    />
                </div>
            </div>

            <hr className="divider" />

            {/* STYLE */}
            <div>
                <div className="section-label">Poster Style</div>
                <div className="style-grid">
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

                <label style={{ marginTop: 14 }}>Accent Color</label>
                <div className="color-row" style={{ marginTop: 8 }}>
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

            {/* FORMAT */}
            <div>
                <div className="section-label">Format</div>
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
            </div>

            <hr className="divider" />

            {/* AI HEADLINES */}
            <div>
                <div className="section-label">AI Headline Generator</div>
                <div className="field-group">
                    <button className="btn btn-secondary" onClick={onAiEnhance} disabled={loading}>
                        Generate Punchy Headlines
                    </button>
                </div>
                {aiHeadlines.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiHeadlines.map((h, i) => (
                            <div
                                key={i}
                                className="ai-headline-item"
                                onClick={() => onSelectHeadline(h)}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                )}
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

        </aside>
    );
}
