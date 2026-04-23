import { generateLayout } from '../engine/layoutEngine.js';

export const STYLES = {
    'dark-blue': { bg: '#0a1628', overlay: 'rgba(5,15,35,0.72)', stripe: '#00d4ff', textMain: '#ffffff', textAccent: '#00d4ff', solidBg: '#0a1628' },
    'black-red': { bg: '#0d0000', overlay: 'rgba(10,0,0,0.75)', stripe: '#ff3c5f', textMain: '#ffffff', textAccent: '#ff3c5f', solidBg: '#0d0000' },
    'white-punch': { bg: '#f0f0f0', overlay: 'rgba(240,240,240,0.55)', stripe: '#111', textMain: '#111111', textAccent: '#111111', solidBg: '#f0eeea' },
    'gold-black': { bg: '#0a0900', overlay: 'rgba(8,7,0,0.78)', stripe: '#ffd600', textMain: '#ffffff', textAccent: '#ffd600', solidBg: '#0a0900' },
};

export const COLOR_SWATCHES = [
    '#00d4ff', '#ff3c5f', '#ffd600', '#00e676',
    '#ff6d00', '#d500f9', '#ffffff',
];

export const STYLE_OPTIONS = [
    { id: 'dark-blue', label: 'Dark Blue', sub: 'Cyan energy', color: '#00d4ff' },
    { id: 'black-red', label: 'Black Red', sub: 'Breaking news', color: '#ff3c5f' },
    { id: 'white-punch', label: 'White Punch', sub: 'Clean editorial', color: '#222222' },
    { id: 'gold-black', label: 'Gold Black', sub: 'Premium feel', color: '#ffd600' },
];

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function resolveImageItem(image) {
    if (!image) return null;
    return image.img ? image : { img: image, zoom: 1, offsetX: 0, offsetY: 0 };
}

function getPanValue(value) {
    return clamp((value ?? 0) / 100, -1, 1);
}

function getCropBounds(frameStart, frameSize, drawnSize) {
    if (drawnSize <= frameSize) {
        const centered = frameStart + (frameSize - drawnSize) / 2;
        return { min: centered, max: centered };
    }

    return {
        min: frameStart + frameSize - drawnSize,
        max: frameStart,
    };
}

function applyPersistentPan(basePosition, bounds, pan) {
    const travel = (bounds.max - bounds.min) / 2;
    const shifted = basePosition - pan * travel;
    return clamp(shifted, bounds.min, bounds.max);
}

function chunkWord(ctx, word, maxWidth) {
    const pieces = [];
    let current = '';

    for (const char of word) {
        const test = current + char;
        if (current && ctx.measureText(test).width > maxWidth) {
            pieces.push(current);
            current = char;
        } else {
            current = test;
        }
    }

    if (current) {
        pieces.push(current);
    }

    return pieces;
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const rawWord of words) {
        const wordParts = ctx.measureText(rawWord.replace(/\*/g, '')).width > maxWidth
            ? chunkWord(ctx, rawWord, maxWidth)
            : [rawWord];

        for (const word of wordParts) {
            const clean = word.replace(/\*/g, '');
            const test = current ? `${current} ${clean}` : clean;
            if (current && ctx.measureText(test).width > maxWidth) {
                lines.push(current);
                current = clean;
            } else {
                current = test;
            }
        }
    }

    if (current) {
        lines.push(current);
    }

    return lines.length > 0 ? lines : [''];
}

function fitTextBlock(ctx, text, options) {
    const {
        maxWidth,
        maxHeight,
        maxLines,
        minFontSize,
        maxFontSize,
        fontFamily,
        fontWeight,
        fontStyle = 'normal',
        lineHeightScale,
    } = options;

    let fontSize = maxFontSize;
    let lines = [''];
    let lineHeight = fontSize * lineHeightScale;

    while (fontSize >= minFontSize) {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        lines = wrapText(ctx, text, maxWidth);
        lineHeight = fontSize * lineHeightScale;
        const totalHeight = lines.length * lineHeight;

        if (lines.length <= maxLines && totalHeight <= maxHeight) {
            break;
        }

        fontSize -= fontSize > 30 ? 4 : 2;
    }

    if (fontSize < minFontSize) {
        fontSize = minFontSize;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        lines = wrapText(ctx, text, maxWidth);
        lineHeight = fontSize * lineHeightScale;
    }

    return { fontSize, lines, lineHeight };
}

function drawImageCropped(ctx, image, x, y, w, h, anchorX = 0.5, anchorY = 0.35, extraScale = 1) {
    const imageItem = resolveImageItem(image);
    const img = imageItem?.img;

    if (!img) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;

    let scale;
    if (ir > cr) scale = h / img.naturalHeight;
    else scale = w / img.naturalWidth;

    scale *= (imageItem.zoom ?? 1) * extraScale;

    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const boundsX = getCropBounds(x, w, dw);
    const boundsY = getCropBounds(y, h, dh);
    const baseDx = x + (w - dw) * clamp(anchorX, 0, 1);
    const baseDy = y + (h - dh) * clamp(anchorY, 0, 1);
    const dx = applyPersistentPan(baseDx, boundsX, getPanValue(imageItem.offsetX));
    const dy = applyPersistentPan(baseDy, boundsY, getPanValue(imageItem.offsetY));

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
}

function drawCircleImage(ctx, image, cx, cy, r, accentColor) {
    const imageItem = resolveImageItem(image);
    const img = imageItem?.img;

    if (!img) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const zoom = imageItem.zoom ?? 1;
    const s = ((r * 2) / Math.min(img.naturalWidth, img.naturalHeight)) * zoom;
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    const frameX = cx - r;
    const frameY = cy - r;
    const boundsX = getCropBounds(frameX, r * 2, dw);
    const boundsY = getCropBounds(frameY, r * 2, dh);
    const baseDx = cx - dw / 2;
    const baseDy = cy - dh / 2;
    const dx = applyPersistentPan(baseDx, boundsX, getPanValue(imageItem.offsetX));
    const dy = applyPersistentPan(baseDy, boundsY, getPanValue(imageItem.offsetY));
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawHeadlineText(ctx, raw, x, y, w, h, colors, align = 'left') {
    if (!raw) return;

    const upper = raw.toUpperCase();
    const textPressure = clamp(upper.replace(/\*/g, '').length / 70, 0, 1);
    const maxFontSize = Math.min(Math.round(w / (7.8 + textPressure * 1.8)), Math.round(h / 1.45), 110);
    const { fontSize, lines, lineHeight } = fitTextBlock(ctx, upper, {
        maxWidth: w,
        maxHeight: h,
        maxLines: 7,
        minFontSize: 12,
        maxFontSize,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        lineHeightScale: 0.98,
    });

    ctx.font = `normal 900 ${fontSize}px 'Barlow Condensed', sans-serif`;
    const totalHeight = lines.length * lineHeight;
    let currentY = y + fontSize + Math.max(0, (h - totalHeight) * 0.05);
    const rawWords = raw.toUpperCase().split(' ');
    let wordIdx = 0;

    for (const line of lines) {
        const lineWords = line.split(' ');
        const lineText = lineWords.join(' ');
        const lineW = ctx.measureText(lineText).width;

        let drawX;
        if (align === 'center') drawX = x + (w - lineW) / 2;
        else if (align === 'right') drawX = x + w - lineW;
        else drawX = x;

        for (const word of lineWords) {
            const srcWord = rawWords[wordIdx] || '';
            const isHighlighted = srcWord.includes('*');
            const cleanWord = word.replace(/\*/g, '');
            ctx.fillStyle = isHighlighted ? colors.accent : colors.main;
            ctx.fillText(cleanWord, drawX, currentY);
            drawX += ctx.measureText(`${cleanWord} `).width;
            wordIdx++;
        }

        currentY += lineHeight;
    }
}

function drawSubtextText(ctx, text, x, y, w, h, colors, align = 'left') {
    if (!text) return;

    const { fontSize, lines, lineHeight } = fitTextBlock(ctx, text, {
        maxWidth: w,
        maxHeight: h,
        maxLines: 4,
        minFontSize: 10,
        maxFontSize: Math.min(Math.round(w / 26), 38),
        fontFamily: "'Barlow', sans-serif",
        fontWeight: 500,
        fontStyle: 'italic',
        lineHeightScale: 1.25,
    });

    ctx.font = `italic 500 ${fontSize}px 'Barlow', sans-serif`;
    ctx.fillStyle = colors.sub;

    let currentY = y + fontSize;
    for (const line of lines) {
        const lw = ctx.measureText(line).width;
        let drawX;
        if (align === 'center') drawX = x + (w - lw) / 2;
        else if (align === 'right') drawX = x + w - lw;
        else drawX = x;

        ctx.fillText(line, drawX, currentY);
        currentY += lineHeight;
    }
}

function drawBadge(ctx, x, y, label, accentColor) {
    const fontSize = 24;
    ctx.font = `700 ${fontSize}px 'Barlow Condensed', sans-serif`;
    const tw = ctx.measureText(label).width;
    const padX = 14;
    const padY = 8;
    const bW = tw + padX * 2;
    const bH = fontSize + padY * 2;
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y - bH, bW, bH);
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + padX, y - bH + padY + 2);
    ctx.textBaseline = 'alphabetic';
}

function drawBrandWatermark(ctx, x, y, brandName, accentColor) {
    if (!brandName) return;
    const upper = brandName.toUpperCase();
    const fontSize = 26;
    ctx.font = `700 ${fontSize}px 'Barlow Condensed', sans-serif`;
    const tw = ctx.measureText(upper).width;
    const padX = 20;
    const padY = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - tw - padX * 2, y - fontSize - padY, tw + padX * 2, fontSize + padY * 2);
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(upper, x - padX, y + padY * 0.4);
    ctx.textAlign = 'left';
}

function drawOverlay(ctx, zone, theme, W, H) {
    switch (zone.subtype) {
        case 'dark-overlay':
            ctx.fillStyle = theme.overlay;
            ctx.fillRect(0, 0, W, H);
            break;
        case 'solid-dark':
            ctx.fillStyle = theme.solidBg || '#0a0a0a';
            ctx.fillRect(0, 0, W, H);
            break;
        case 'vignette': {
            const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
            v.addColorStop(0, 'rgba(0,0,0,0)');
            v.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = v;
            ctx.fillRect(0, 0, W, H);
            break;
        }
        case 'bottom-gradient': {
            const startY = zone.startY ?? H * 0.55;
            const height = zone.height ?? H * 0.45;
            const bg = ctx.createLinearGradient(0, startY, 0, startY + height);
            bg.addColorStop(0, 'rgba(0,0,0,0)');
            bg.addColorStop(0.35, 'rgba(0,0,0,0.82)');
            bg.addColorStop(1, 'rgba(0,0,0,0.97)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, startY, W, height + 10);
            break;
        }
        case 'side-fade': {
            const splitX = zone.splitX || W * 0.5;
            const fadeW = Math.round(W * 0.12);
            const sf = ctx.createLinearGradient(splitX - fadeW, 0, splitX + 20, 0);
            sf.addColorStop(0, 'rgba(0,0,0,0)');
            sf.addColorStop(1, theme.solidBg || 'rgba(0,0,0,0.97)');
            ctx.fillStyle = sf;
            ctx.fillRect(splitX - fadeW, 0, fadeW + 20, H);
            break;
        }
    }
}

function drawSolidBg(ctx, zone, theme) {
    ctx.fillStyle = theme.solidBg || theme.bg || '#0a0a0a';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
}

export function renderPoster({ canvas, state }) {
    const ctx = canvas.getContext('2d');

    const {
        images = [],
        headline = '',
        subtext = '',
        brandName = '',
        style = 'dark-blue',
        accentColor,
        format = 'square',
        layoutSeed = 0,
        layoutHistory = [],
        customBadge = 'NEWS',
    } = state;

    const isStory = format === 'story';
    const W = 1080;
    const H = isStory ? 1920 : 1080;
    canvas.width = W;
    canvas.height = H;

    const theme = { ...STYLES[style] };
    const accent = accentColor || theme.stripe;
    const colors = {
        main: theme.textMain,
        accent,
        sub: style === 'white-punch' ? 'rgba(17,17,17,0.72)' : 'rgba(240,240,240,0.78)',
    };

    const layout = generateLayout(images, { headline, subtext, brandName }, {
        seed: layoutSeed,
        format,
        history: layoutHistory,
    });

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    const order = { 'solid-bg': 0, image: 1, 'image-circle': 1, overlay: 2, stripe: 3, badge: 4, brand: 4, headline: 5, subtext: 5 };
    const sorted = [...layout.zones].sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));

    for (const zone of sorted) {
        ctx.save();
        ctx.globalAlpha = zone.opacity ?? 1;

        switch (zone.type) {
            case 'solid-bg':
                drawSolidBg(ctx, zone, theme);
                break;

            case 'image':
                if (zone.img) {
                    if (zone.outline) {
                        ctx.fillStyle = accent;
                        ctx.fillRect(zone.x - 3, zone.y - 3, zone.w + 6, zone.h + 6);
                    }
                    drawImageCropped(ctx, zone.img, zone.x, zone.y, zone.w, zone.h, zone.anchorX, zone.anchorY);
                } else {
                    const grad = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.w, zone.y + zone.h);
                    grad.addColorStop(0, theme.bg);
                    grad.addColorStop(1, '#000000');
                    ctx.fillStyle = grad;
                    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
                }
                break;

            case 'image-circle':
                drawCircleImage(ctx, zone.img, zone.cx, zone.cy, zone.r, accent);
                break;

            case 'overlay':
                ctx.globalAlpha = 1;
                drawOverlay(ctx, zone, theme, W, H);
                break;

            case 'stripe':
                ctx.fillStyle = accent;
                ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
                break;

            case 'badge':
                ctx.globalAlpha = 1;
                drawBadge(ctx, zone.x, zone.y, customBadge || zone.label || 'NEWS', accent);
                break;

            case 'brand':
                ctx.globalAlpha = 1;
                drawBrandWatermark(ctx, zone.x, zone.y, brandName, accent);
                break;

            case 'headline':
                ctx.globalAlpha = 1;
                drawHeadlineText(ctx, headline, zone.x, zone.y, zone.w, zone.h, colors, zone.align);
                break;

            case 'subtext':
                ctx.globalAlpha = 1;
                drawSubtextText(ctx, subtext, zone.x, zone.y, zone.w, zone.h, colors, zone.align);
                break;
        }

        ctx.restore();
    }

    return { layout };
}
