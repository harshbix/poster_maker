// ============================================================
// EXPORT SYSTEM
// Always renders at fixed 1080px internal resolution.
// Preview scaling is separate from export resolution.
// ============================================================

import { drawPoster } from './renderer.js';

const INTERNAL_W = 1080;

/**
 * Generate filename using convention: {brand}_{YYYYMMDD}_{templateId}_{format}.png
 */
function buildFilename(brand, templateId, format) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeBrand = (brand || 'poster').replace(/\s+/g, '_').toUpperCase();
    return `${safeBrand}_${date}_${templateId}_${format}.png`;
}

/**
 * Create a canvas element — uses OffscreenCanvas if available for performance.
 * Returns { canvas, ctx }.
 */
function createCanvas(W, H) {
    if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(W, H);
        return { canvas, ctx: canvas.getContext('2d'), offscreen: true };
    }
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    return { canvas, ctx: canvas.getContext('2d'), offscreen: false };
}

/**
 * Convert canvas/OffscreenCanvas to a Blob.
 */
async function toBlob(canvas, offscreen) {
    if (offscreen) {
        return canvas.convertToBlob({ type: 'image/png' });
    }
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Export poster as a PNG download.
 *
 * @param {Object} opts
 * @param {Object} opts.template     - resolved template object
 * @param {Object} opts.data         - { headline, subtext, bgImage, thumbImage, logoImage, accentColor }
 * @param {Object} opts.brand        - { brandName, logoImage, primaryColor, watermarkOpacity }
 * @param {boolean} [opts.hiDPI]     - if true, render at 2×(2160px) then export at 2× size
 * @param {string} [opts.filename]   - override default filename
 * @returns {Promise<void>}
 */
export async function exportPNG({ template, data, brand, hiDPI = false, filename }) {
    const format = template.format || 'square';
    const H = format === 'story' ? 1920 : 1080;
    const scale = hiDPI ? 2 : 1;
    const W = INTERNAL_W * scale;
    const exportH = H * scale;

    const { canvas, ctx, offscreen } = createCanvas(W, exportH);

    if (scale !== 1) {
        ctx.scale(scale, scale);
    }

    const result = await drawPoster(ctx, {
        template,
        data,
        brand,
        canvasW: INTERNAL_W,
        canvasH: H,
        showSafeZones: false, // NEVER show safe zones on export
    });

    if (!result.ok) {
        console.warn('[Exporter] Layout errors:', result.errors);
    }

    const blob = await toBlob(canvas, offscreen);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || buildFilename(brand?.brandName, template.id, format);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Scale a source canvas (the main display canvas) down for preview display.
 * Returns CSS dimensions to apply to the canvas element.
 *
 * @param {number} canvasW   - actual canvas pixel width (1080)
 * @param {number} canvasH   - actual canvas pixel height (1080 | 1920)
 * @param {number} maxW      - available display width in px
 * @param {number} maxH      - available display height in px
 * @returns {{ width: string, height: string }}
 */
export function previewScale(canvasW, canvasH, maxW, maxH) {
    const scale = Math.min(maxW / canvasW, maxH / canvasH, 1);
    return {
        width: `${Math.floor(canvasW * scale)}px`,
        height: `${Math.floor(canvasH * scale)}px`,
    };
}
