// ============================================================
// POSTER RENDERER — Layout-driven canvas drawing engine.
// Reads a layout descriptor produced by layoutEngine.js.
// Zero React imports. Pure canvas 2D.
// ============================================================

import { generateLayout } from '../engine/layoutEngine.js';

// ---- THEME DEFINITIONS ---- //

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

// ---- UTILITY: draw cropped image into a rect ---- //

function drawImageCropped(ctx, img, x, y, w, h, anchorX = 0.5, anchorY = 0.35, extraScale = 1) {
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
    scale *= extraScale;

    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) * anchorX;
    const dy = y + (h - dh) * anchorY;

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
}

// ---- UTILITY: draw circular clipped image ---- //

function drawCircleImage(ctx, img, cx, cy, r, accentColor) {
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const s = (r * 2) / Math.min(img.naturalWidth, img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();

    // Accent ring
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// ---- UTILITY: wrap & draw text with word highlight ---- //

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const clean = word.replace(/\*/g, '');
        const test = current ? current + ' ' + clean : clean;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = clean;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function drawHeadlineText(ctx, raw, x, y, w, h, colors, align = 'left') {
    if (!raw) return;
    const upper = raw.toUpperCase();
    const words = upper.split(' ');

    // Determine font size that fits both width and height
    let fontSize = Math.min(Math.round(w / 8), 110);
    ctx.font = `900 ${fontSize}px 'Barlow Condensed', sans-serif`;
    let lines = wrapText(ctx, upper, w);
    let textHeight = lines.length * fontSize * 1.05;

    while ((lines.length > 5 || textHeight > h) && fontSize > 16) {
        fontSize -= 4;
        ctx.font = `900 ${fontSize}px 'Barlow Condensed', sans-serif`;
        lines = wrapText(ctx, upper, w);
        textHeight = lines.length * fontSize * 1.05;
    }

    let currentY = y + fontSize;

    // Rebuild lines with original markers for coloring
    const rawUpper = raw.toUpperCase();
    const rawWords = rawUpper.split(' ');
    let wordIdx = 0;

    for (const line of lines) {
        if (currentY > y + h + fontSize) break;

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
            drawX += ctx.measureText(cleanWord + ' ').width;
            wordIdx++;
        }

        currentY += fontSize * 1.05;
    }
}

function drawSubtextText(ctx, text, x, y, w, h, colors, align = 'left') {
    if (!text) return;
    let fontSize = Math.min(Math.round(w / 28), 38);
    ctx.font = `500 italic ${fontSize}px 'Barlow', sans-serif`;
    ctx.fillStyle = 'rgba(240,240,240,0.72)';

    let lines = wrapText(ctx, text, w);
    let textHeight = lines.length * fontSize * 1.35;

    while ((lines.length > 3 || textHeight > h) && fontSize > 12) {
        fontSize -= 2;
        ctx.font = `500 italic ${fontSize}px 'Barlow', sans-serif`;
        lines = wrapText(ctx, text, w);
        textHeight = lines.length * fontSize * 1.35;
    }

    let currentY = y + fontSize;
    for (const line of lines) {
        if (currentY > y + h + fontSize * 0.5) break;
        const lw = ctx.measureText(line).width;
        let drawX;
        if (align === 'center') drawX = x + (w - lw) / 2;
        else if (align === 'right') drawX = x + w - lw;
        else drawX = x;
        ctx.fillText(line, drawX, currentY);
        currentY += fontSize * 1.35;
    }
}

function drawBadge(ctx, x, y, label, accentColor) {
    const fontSize = 24;
    ctx.font = `700 ${fontSize}px 'Barlow Condensed', sans-serif`;
    const tw = ctx.measureText(label).width;
    const padX = 14, padY = 8;
    const bW = tw + padX * 2, bH = fontSize + padY * 2;
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
    const padX = 20, padY = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - tw - padX * 2, y - fontSize - padY, tw + padX * 2, fontSize + padY * 2);
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(upper, x - padX, y + padY * 0.4);
    ctx.textAlign = 'left';
}

// ---- DRAW OVERLAY ---- //

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

// ---- DRAW SOLID BG ZONE ---- //

function drawSolidBg(ctx, zone, theme) {
    ctx.fillStyle = theme.solidBg || theme.bg || '#0a0a0a';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
}

// ---- MAIN RENDER FUNCTION ---- //

/**
 * Render a poster onto a canvas element.
 *
 * @param {{ canvas: HTMLCanvasElement, state: Object }} param0
 */
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
    const colors = { main: theme.textMain, accent };

    // Generate layout — extract bare HTMLImageElements from {img, src, id} wrappers
    const imgEls = images.map(i => (i && i.img ? i.img : i)).filter(Boolean);
    const layout = generateLayout(imgEls, { headline, subtext, brandName }, {
        seed: layoutSeed,
        format,
        history: layoutHistory,
    });

    // ---- PHASE 1: Base background ---- //
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    // Sort zones: solid-bg first, then images, then overlays, then text
    const order = { 'solid-bg': 0, image: 1, 'image-circle': 1, overlay: 2, stripe: 3, badge: 4, brand: 4, headline: 5, subtext: 5 };
    const sorted = [...layout.zones].sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));

    // ---- Draw each zone ---- //
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
                        // Draw accent outline first
                        ctx.fillStyle = accent;
                        ctx.fillRect(zone.x - 3, zone.y - 3, zone.w + 6, zone.h + 6);
                    }
                    drawImageCropped(ctx, zone.img, zone.x, zone.y, zone.w, zone.h, zone.anchorX, zone.anchorY);
                } else {
                    // No image placeholder — draw gradient
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

    // Return layout info for display
    return { layout };
}
