import { useState, useRef } from 'react';
import { STYLE_OPTIONS, COLOR_SWATCHES } from '../lib/posterRenderer';
import { INITIAL_STATE } from '../hooks/usePosterState';
import { FORMAT_OPTIONS, WORKSPACE_COPY } from '../config/appConfig';

function SelectCard({ active, name, sub, onClick, color }) {
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <div
            className={`style-card${active ? ' active' : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-pressed={active}
        >
            <div className="style-name" style={color ? { color } : undefined}>{name}</div>
            <div className="style-sub">{sub}</div>
        </div>
    );
}

function ImageChip({ item, index, isSelected, onRemove, onSelect }) {
    return (
        <div
            className={`img-chip${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(item.id);
                }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
        >
            <img src={item.src} alt={`Uploaded asset ${index + 1}`} className="img-chip-thumb" />
            <div className="img-chip-meta">
                <span>{index === 0 ? 'Hero default' : `Image ${index + 1}`}</span>
            </div>
            <button
                type="button"
                className="img-chip-remove"
                onClick={(event) => {
                    event.stopPropagation();
                    onRemove(item.id);
                }}
                title="Remove image"
                aria-label={`Remove uploaded image ${index + 1}`}
            >
                x
            </button>
        </div>
    );
}

function SliderRow({ label, value, min, max, step, displayValue, onChange }) {
    return (
        <div className="slider-row">
            <div className="slider-topline">
                <label>{label}</label>
                <span className="slider-value">{displayValue}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

function DropZone({ disabled, onFiles }) {
    const inputRef = useRef(null);
    const [over, setOver] = useState(false);

    const openPicker = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) onFiles(files);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
        }
    };

    return (
        <div
            className={`drop-zone${over ? ' dragover' : ''}${disabled ? ' disabled' : ''}`}
            onDragOver={e => {
                e.preventDefault();
                if (!disabled) setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
            onClick={openPicker}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => {
                    onFiles(e.target.files);
                    e.target.value = '';
                }}
            />
            <div className="drop-zone-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
            </div>
            <p className="drop-zone-label">Drop images here or <span>click to browse</span></p>
            <p className="drop-zone-sub">PNG, JPG, and WebP work best.</p>
        </div>
    );
}

export default function Sidebar({
    state,
    status,
    isImporting,
    canDownload,
    selectedImageId,
    selectedImage,
    onFiles,
    onRemoveImage,
    onSelectImage,
    onImageAdjust,
    onImageReset,
    onFieldChange,
    onStyleChange,
    onAccentChange,
    onFormatChange,
    onShuffle,
    onDownload,
}) {
    const hasImages = state.images.length > 0;
    const canShuffle = Boolean(state.headline.trim() || hasImages);

    return (
        <aside className="sidebar">
            <div className="sidebar-intro">
                <div className="section-label">Workflow</div>
                <p className="sidebar-intro-copy">
                    {WORKSPACE_COPY.sidebarIntro}
                </p>
            </div>

            <button
                id="btn-shuffle"
                type="button"
                className="btn btn-shuffle"
                onClick={onShuffle}
                disabled={!canShuffle || isImporting}
            >
                <span className="shuffle-icon">⟳</span>
                Shuffle Layout
            </button>

            <div>
                <div className="section-label">Images</div>

                {state.images.length > 0 && (
                    <div className="img-chip-grid">
                        {state.images.map((item, index) => (
                            <ImageChip
                                key={item.id}
                                item={item}
                                index={index}
                                isSelected={selectedImageId === item.id}
                                onSelect={onSelectImage}
                                onRemove={onRemoveImage}
                            />
                        ))}
                    </div>
                )}

                <DropZone disabled={isImporting} onFiles={onFiles} />

                <p className="helper-text">
                    {hasImages
                        ? 'Click any image to fine-tune zoom and framing. Those adjustments stay with the image across layout shuffles.'
                        : 'You can build a text-only poster too, but images unlock the full range of layout options.'}
                </p>
            </div>

            {selectedImage && (
                <>
                    <hr className="divider" />

                    <div>
                        <div className="section-label">Framing</div>
                        <div className="image-adjust-card">
                            <div className="image-adjust-header">
                                <div>
                                    <div className="image-adjust-title">{selectedImage.name || 'Selected image'}</div>
                                    <div className="image-adjust-sub">Adjust how this image crops inside every layout.</div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => onImageReset(selectedImage.id)}
                                >
                                    Reset
                                </button>
                            </div>

                            <SliderRow
                                label="Zoom"
                                value={selectedImage.zoom ?? 1}
                                min={1}
                                max={2.6}
                                step={0.01}
                                displayValue={`${Math.round((selectedImage.zoom ?? 1) * 100)}%`}
                                onChange={(value) => onImageAdjust(selectedImage.id, { zoom: value })}
                            />
                            <SliderRow
                                label="Horizontal"
                                value={selectedImage.offsetX ?? 0}
                                min={-100}
                                max={100}
                                step={1}
                                displayValue={`${selectedImage.offsetX ?? 0}`}
                                onChange={(value) => onImageAdjust(selectedImage.id, { offsetX: value })}
                            />
                            <SliderRow
                                label="Vertical"
                                value={selectedImage.offsetY ?? 0}
                                min={-100}
                                max={100}
                                step={1}
                                displayValue={`${selectedImage.offsetY ?? 0}`}
                                onChange={(value) => onImageAdjust(selectedImage.id, { offsetY: value })}
                            />
                        </div>
                    </div>
                </>
            )}

            <hr className="divider" />

            <div>
                <div className="section-label">Content</div>
                <div className="field-group">
                    <label htmlFor="headline">Main Title</label>
                    <textarea
                        id="headline"
                        rows={3}
                        value={state.headline}
                        onChange={e => onFieldChange('headline', e.target.value)}
                        onFocus={() => {
                            if (state.headline === INITIAL_STATE.headline) onFieldChange('headline', '');
                        }}
                        placeholder="Add the main headline for your poster"
                    />
                    <p className="helper-text">Long headlines now shrink automatically to fit. Wrap words in *asterisks* to highlight them.</p>

                    <label htmlFor="subtext">Subtext</label>
                    <input
                        type="text"
                        id="subtext"
                        value={state.subtext}
                        onChange={e => onFieldChange('subtext', e.target.value)}
                        onFocus={() => {
                            if (state.subtext === INITIAL_STATE.subtext) onFieldChange('subtext', '');
                        }}
                        placeholder="Add supporting context or a short kicker"
                    />

                    <label htmlFor="brand-name">Brand Name</label>
                    <input
                        type="text"
                        id="brand-name"
                        value={state.brandName}
                        onChange={e => onFieldChange('brandName', e.target.value)}
                        onFocus={() => {
                            if (state.brandName === INITIAL_STATE.brandName) onFieldChange('brandName', '');
                        }}
                        placeholder="Add a brand, creator name, or publication"
                    />

                    <label htmlFor="custom-badge">Badge Label</label>
                    <input
                        type="text"
                        id="custom-badge"
                        value={state.customBadge || ''}
                        onChange={e => onFieldChange('customBadge', e.target.value)}
                        onFocus={() => {
                            if (state.customBadge === INITIAL_STATE.customBadge) onFieldChange('customBadge', '');
                        }}
                        placeholder="Top Story"
                    />
                </div>
            </div>

            <hr className="divider" />

            <div>
                <div className="section-label">Design</div>

                <label>Format</label>
                <div className="style-grid" style={{ marginBottom: 16 }}>
                    {FORMAT_OPTIONS.map(f => (
                        <SelectCard
                            key={f.id}
                            active={state.format === f.id}
                            name={f.label}
                            sub={f.sub}
                            onClick={() => onFormatChange(f.id)}
                        />
                    ))}
                </div>

                <label>Theme</label>
                <div className="style-grid" style={{ marginBottom: 16 }}>
                    {STYLE_OPTIONS.map(s => (
                        <SelectCard
                            key={s.id}
                            active={state.style === s.id}
                            name={s.label}
                            sub={s.sub}
                            color={s.color}
                            onClick={() => onStyleChange(s.id)}
                        />
                    ))}
                </div>

                <label>Accent Color</label>
                <div className="color-row">
                    {COLOR_SWATCHES.map(color => (
                        <button
                            key={color}
                            type="button"
                            className={`color-swatch${state.accentColor === color ? ' active' : ''}`}
                            style={{ background: color }}
                            onClick={() => onAccentChange(color)}
                            aria-label={`Set accent color to ${color}`}
                        />
                    ))}
                </div>
            </div>

            <hr className="divider" />

            <div className="status-bar" id="status-bar" aria-live="polite">
                <div className={`status-dot${status.type ? ` ${status.type}` : ''}`} />
                <span>{status.msg || 'Ready'}</span>
            </div>

            <button
                type="button"
                className="btn btn-secondary"
                onClick={onDownload}
                disabled={!canDownload || isImporting}
            >
                Download PNG
            </button>
        </aside>
    );
}
