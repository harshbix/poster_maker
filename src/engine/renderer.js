// ============================================================
// CORE RENDERER
// JSON-driven canvas drawing engine.
// Reads template config dynamically — zero hardcoded layout logic.
// Zero React imports.
// ============================================================

import { fitText, drawFittedText, measuredHeight } from './typography.js';
import { drawCropped, drawCircularImage, checkResolution, drawBlurredBackground } from './imageProcessor.js';
import { drawSafeZones } from './safeZones.js';

/**
 * @typedef {Object} DrawData
 * @property {string}           headline
 * @property {string}           [subtext]
 * @property {HTMLImageElement} [bgImage]
 * @property {HTMLImageElement} [thumbImage]
 * @property {HTMLImageElement} [logoImage]
 * @property {string}           accentColor   - overrides template defaultAccent if set
 */

/**
 * @typedef {Object} BrandKit
 * @property {string}           brandName
 * @property {HTMLImageElement} [logoImage]
 * @property {number}           watermarkOpacity
 */

/**
 * @typedef {Object} LayoutError
 * @property {string} zoneId
 * @property {string} message
 */

/**
 * Resolve a zone's y position. Supports "bottom-N" anchoring.
 * @param {string|number} y
 * @param {number} H - canvas height
 */
function resolveY(y, H) {
    if (typeof y === 'string' && y.startsWith('bottom-')) {
        return H - parseInt(y.slice(7), 10);
    }
    return y;
}

/**
 * Resolve a zone's width. Supports "fill" keyword.
 * @param {string|number} w
 * @param {number} W - canvas width
 */
function resolveWidth(w, W) {
    return w === 'fill' ? W : w;
}

/**
 * Build color palette from template theme + accent override.
 */
function buildColors(theme, accentColor) {
    return {
        main: theme.textMain,
        accent: accentColor || theme.defaultAccent || theme.textAccent,
    };
}

// ---- ZONE DRAW HANDLERS ---- //

function drawBgZone(ctx, zone, data, theme, W, H) {
    const warnings = [];
    if (data.bgImage) {
        const res = checkResolution(data.bgImage, W, H);
        if (res.warning) warnings.push({ zoneId: zone.id, message: res.warning });
        if (!res.ok) {
            drawBlurredBackground(ctx, data.bgImage, W, H, 14, data.bgTransform);
        } else {
            drawCropped(ctx, data.bgImage, 0, 0, W, H, data.bgTransform);
        }
    } else {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, theme.bg);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }
    return warnings;
}

function drawOverlays(ctx, overlays, theme, W, H) {
    if (overlays.includes('dark-overlay')) {
        ctx.fillStyle = theme.overlay;
        ctx.fillRect(0, 0, W, H);
    }
    if (overlays.includes('vignette')) {
        const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
    }
    if (overlays.includes('bottom-gradient')) {
        const bH = zone_bottomGradientH(H);
        const bg = ctx.createLinearGradient(0, H - bH, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)');
        bg.addColorStop(0.4, 'rgba(0,0,0,0.85)');
        bg.addColorStop(1, 'rgba(0,0,0,0.97)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, H - bH, W, bH);
    }
}

function zone_bottomGradientH(H) {
    return H > 1200 ? 700 : 460;
}

function drawStripeZone(ctx, zone, colors, W, H) {
    const y = resolveY(zone.y, H);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(resolveWidth(zone.x, W), y, resolveWidth(zone.width, W), zone.height);
}

function drawBrandZone(ctx, zone, data, brand, colors, W, H) {
    const brandName = (data.brandName || brand?.brandName || '').toUpperCase();
    if (!brandName) return;
    const y = resolveY(zone.y, H);
    const c = zone.constraints || {};
    const fontSize = c.fontSize || 26;
    ctx.font = `${c.fontWeight || 700} ${fontSize}px '${c.fontFamily || 'Barlow Condensed'}', sans-serif`;
    const tw = ctx.measureText(brandName).width;
    const padX = c.paddingX || 20;
    const boxH = fontSize + (c.paddingY || 16);
    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W - tw - padX * 2 - (c.right || 32), y - fontSize - (c.paddingY || 10) / 2, tw + padX * 2, boxH);
    ctx.fillStyle = colors.accent;
    ctx.textAlign = 'right';
    ctx.fillText(brandName, W - (c.right || 44), y - (c.paddingY || 10) / 2 + fontSize);
    ctx.textAlign = 'left';
}

function drawLogoZone(ctx, zone, data, brand, W, H) {
    const logoImg = data.logoImage || brand?.logoImage;
    if (!logoImg) return;
    const y = resolveY(zone.y, H);
    const x = resolveWidth(zone.x, W);
    const targetH = zone.height;
    const targetW = logoImg.width * (targetH / logoImg.height);
    const opacity = brand?.watermarkOpacity ?? 0.92;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoImg, x === 'fill' ? W - targetW - 32 : x, y, targetW, targetH);
    ctx.restore();
}

function drawThumbnailZone(ctx, zone, data, colors, W, H) {
    if (!data.thumbImage) return;
    const x = resolveWidth(zone.x, W);
    const y = resolveY(zone.y, H);
    const r = zone.radius || zone.height / 2;
    const cx = (x === 'fill' ? W - zone.width - 48 : x) + r;
    const cy = y + r;
    drawCircularImage(ctx, data.thumbImage, cx, cy, r, { color: colors.accent, width: 5 }, data.thumbTransform);
}

function drawHeadlineZone(ctx, zone, data, colors, W, H) {
    if (!data.headline) return;
    const errors = [];
    const y = resolveY(zone.y, H);
    const x = resolveWidth(zone.x, W);
    const c = zone.constraints || {};
    const textZone = {
        x: x,
        y: y,
        width: resolveWidth(zone.width, W),
        height: zone.height,
    };
    const fit = fitText(ctx, data.headline, textZone, {
        fontFamily: c.fontFamily || 'Barlow Condensed',
        fontWeight: c.fontWeight || 900,
        minSize: c.minSize || 36,
        maxSize: c.maxSize || 110,
        maxLines: c.maxLines || 5,
        lineHeight: c.lineHeight || 1.05,
        transform: c.transform || 'uppercase',
    });
    if (fit.overflow) errors.push({ zoneId: zone.id, message: 'Headline truncated — consider shorter text' });
    drawFittedText(ctx, fit, textZone, {
        fontFamily: c.fontFamily || 'Barlow Condensed',
        fontWeight: c.fontWeight || 900,
        lineHeight: c.lineHeight || 1.05,
        align: c.align || 'left',
    }, colors, c.alternateWordColor !== false);
    return errors;
}

function drawSubtextZone(ctx, zone, data, colors, W, H) {
    if (!data.subtext) return;
    const y = resolveY(zone.y, H);
    const x = resolveWidth(zone.x, W);
    const c = zone.constraints || {};
    const textZone = {
        x: x,
        y: y,
        width: resolveWidth(zone.width, W),
        height: zone.height,
    };
    const fit = fitText(ctx, data.subtext, textZone, {
        fontFamily: c.fontFamily || 'Barlow',
        fontWeight: c.fontWeight || 500,
        minSize: c.minSize || 18,
        maxSize: c.maxSize || 40,
        maxLines: c.maxLines || 3,
        lineHeight: c.lineHeight || 1.3,
        transform: c.transform || 'none',
    });
    const subtextColors = { main: c.color || 'rgba(240,240,240,0.72)', accent: colors.accent };
    drawFittedText(ctx, fit, textZone, {
        fontFamily: c.fontFamily || 'Barlow',
        fontWeight: c.fontWeight || 500,
        lineHeight: c.lineHeight || 1.3,
        align: c.align || 'left',
    }, subtextColors, false);
}

// ---- MAIN DRAW FUNCTION ---- //

/**
 * Draw a poster onto a canvas context using a template config.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} opts
 * @param {Object}   opts.template     - resolved template (from registry)
 * @param {DrawData} opts.data         - user content
 * @param {BrandKit} opts.brand        - brand kit settings
 * @param {number}   opts.canvasW
 * @param {number}   opts.canvasH
 * @param {boolean}  [opts.showSafeZones]
 * @param {string[]} [opts.activeSafeZones]
 * @returns {{ ok: boolean, errors: LayoutError[] }}
 */
export async function drawPoster(ctx, { template, data, brand, canvasW, canvasH, showSafeZones = false, activeSafeZones = [] }) {
    const W = canvasW;
    const H = canvasH;
    const errors = [];

    const colors = buildColors(template.theme, data.accentColor);

    // ---- 1. Background ----
    const bgWarnings = drawBgZone(ctx, { id: 'bg' }, data, template.theme, W, H);
    if (bgWarnings) errors.push(...bgWarnings);

    // ---- 2. Overlays (vignette, dark-overlay, bottom-gradient) ----
    drawOverlays(ctx, template.overlays || [], template.theme, W, H);

    // ---- 3. Zones (ordered draw list from template) ----
    for (const zone of template.zones) {
        const zoneErrors = (() => {
            switch (zone.type) {
                case 'thumbnail': return drawThumbnailZone(ctx, zone, data, colors, W, H);
                case 'stripe': return drawStripeZone(ctx, zone, colors, W, H);
                case 'brand': return drawBrandZone(ctx, zone, data, brand, colors, W, H);
                case 'logo': return drawLogoZone(ctx, zone, data, brand, W, H);
                case 'headline': return drawHeadlineZone(ctx, zone, data, colors, W, H);
                case 'subtext': return drawSubtextZone(ctx, zone, data, colors, W, H);
                default:
                    console.warn(`[Renderer] Unknown zone type: ${zone.type}`);
                    return [];
            }
        })();
        if (Array.isArray(zoneErrors)) errors.push(...zoneErrors);
    }

    // ---- 4. Safe zones (preview only) ----
    if (showSafeZones && activeSafeZones.length > 0) {
        drawSafeZones(ctx, W, H, activeSafeZones);
    }

    return { ok: errors.filter(e => !e.message.includes('quality')).length === 0, errors };
}
