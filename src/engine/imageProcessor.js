// ============================================================
// IMAGE PROCESSOR
// Center-crop, circular mask, resolution validation, blur fallback
// ============================================================

/**
 * Compute source crop rect that fills (targetW × targetH) centered on the image.
 * Respects an optional focal point (normalized 0–1).
 *
 * @param {{ width: number, height: number }} img
 * @param {number} targetW
 * @param {number} targetH
 * @param {{ x: number, y: number } | null} focal
 * @returns {{ sx: number, sy: number, sw: number, sh: number }}
 */
export function computeCrop(img, targetW, targetH, focal = null) {
    const imgR = img.width / img.height;
    const tgtR = targetW / targetH;
    let sw, sh;

    if (imgR > tgtR) {
        // Image is wider than target → crop sides
        sh = img.height;
        sw = img.height * tgtR;
    } else {
        // Image is taller than target → crop top/bottom
        sw = img.width;
        sh = img.width / tgtR;
    }

    // Default: center crop
    let sx = (img.width - sw) / 2;
    let sy = (img.height - sh) / 2;

    // Apply focal point offset (clamped so crop stays in bounds)
    if (focal) {
        const focalX = focal.x * img.width;
        const focalY = focal.y * img.height;
        sx = Math.max(0, Math.min(img.width - sw, focalX - sw / 2));
        sy = Math.max(0, Math.min(img.height - sh, focalY - sh / 2));
    }

    return { sx, sy, sw, sh };
}

/**
 * Draw an image into (destX, destY, destW, destH) using center-crop.
 */
export function drawCropped(ctx, img, destX, destY, destW, destH, focal = null) {
    const { sx, sy, sw, sh } = computeCrop(img, destW, destH, focal);
    ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destW, destH);
}

/**
 * Apply a circular clip path centered at (cx, cy) with radius r.
 * Caller must ctx.save() before and ctx.restore() after drawing.
 */
export function circularMask(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
}

/**
 * Draw an image inside a circle, center-cropped.
 * Draws a border ring after restoring clip.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} cx - circle center x
 * @param {number} cy - circle center y
 * @param {number} r  - circle radius
 * @param {{ color: string, width: number } | null} border
 */
export function drawCircularImage(ctx, img, cx, cy, r, border = null) {
    ctx.save();
    circularMask(ctx, cx, cy, r);
    drawCropped(ctx, img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    if (border) {
        ctx.strokeStyle = border.color;
        ctx.lineWidth = border.width;
        ctx.beginPath();
        ctx.arc(cx, cy, r + border.width / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/**
 * Check if an image has sufficient resolution for the target canvas size.
 * Returns a warning when the image is < 50% of required pixels in either dimension.
 *
 * @returns {{ ok: boolean, warning: string | null }}
 */
export function checkResolution(img, targetW, targetH) {
    const scaleW = img.width / targetW;
    const scaleH = img.height / targetH;
    const minScale = Math.min(scaleW, scaleH);

    if (minScale < 0.5) {
        return {
            ok: false,
            warning: `Image resolution (${img.width}×${img.height}) is too low for ${targetW}×${targetH} export. Poster may appear blurry.`,
        };
    }
    if (minScale < 0.8) {
        return {
            ok: true,
            warning: `Image resolution is lower than ideal — slight quality loss possible.`,
        };
    }
    return { ok: true, warning: null };
}

/**
 * Draw a background image with a CSS-like blur effect.
 * Used as fallback when resolution is below threshold.
 * Applies a Gaussian-style blur via repeated scale + alpha passes.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} W
 * @param {number} H
 * @param {number} blurRadius - logical blur (4–20 recommended)
 */
export function drawBlurredBackground(ctx, img, W, H, blurRadius = 12) {
    // Use CanvasFilter if supported (Chrome 92+)
    if (typeof ctx.filter !== 'undefined') {
        ctx.filter = `blur(${blurRadius}px)`;
        // Draw slightly oversized to hide blur edges
        const pad = blurRadius * 2;
        drawCropped(ctx, img, -pad, -pad, W + pad * 2, H + pad * 2);
        ctx.filter = 'none';
    } else {
        // Fallback: draw normally (blur not supported)
        drawCropped(ctx, img, 0, 0, W, H);
    }
}
