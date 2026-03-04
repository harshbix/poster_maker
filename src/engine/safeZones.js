// ============================================================
// SAFE ZONE SYSTEM
// Preview-only overlays. Never affects export canvas.
// ============================================================

/**
 * Safe zone definitions at 1080px width.
 * Values are insets (px) that represent UI chrome areas to avoid.
 */
export const SAFE_ZONE_CONFIGS = {
    'instagram-feed': {
        label: 'IG Feed',
        color: 'rgba(255, 70, 70, 0.35)',
        labelColor: '#ff4646',
        regions: (W, H) => [
            // Instagram like/comment bar at bottom
            { x: 0, y: H - 56, width: W, height: 56 },
        ],
    },
    'instagram-story': {
        label: 'IG Story',
        color: 'rgba(255, 140, 0, 0.35)',
        labelColor: '#ff8c00',
        regions: (W, H) => [
            // Top UI bar (profile + close)
            { x: 0, y: 0, width: W, height: 88 },
            // Bottom CTA area
            { x: 0, y: H - 220, width: W, height: 220 },
        ],
    },
    'tiktok': {
        label: 'TikTok',
        color: 'rgba(0, 200, 150, 0.3)',
        labelColor: '#00c896',
        regions: (W, H) => [
            // Caption + controls column
            { x: 0, y: H - 180, width: W, height: 180 },
            // Right side buttons
            { x: W - 80, y: H * 0.25, width: 80, height: H * 0.55 },
        ],
    },
};

/**
 * Draw safe zone overlays onto a canvas context.
 * ONLY call this on the preview canvas, never the export canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {string[]} activeZones - keys from SAFE_ZONE_CONFIGS
 */
export function drawSafeZones(ctx, W, H, activeZones) {
    if (!activeZones || activeZones.length === 0) return;

    ctx.save();
    ctx.font = "bold 22px 'Barlow Condensed', sans-serif";
    ctx.textBaseline = 'middle';

    for (const zoneKey of activeZones) {
        const config = SAFE_ZONE_CONFIGS[zoneKey];
        if (!config) continue;

        const regions = config.regions(W, H);
        for (const region of regions) {
            // Tinted fill
            ctx.fillStyle = config.color;
            ctx.fillRect(region.x, region.y, region.width, region.height);

            // Hatching lines
            ctx.save();
            ctx.strokeStyle = config.color.replace('0.3', '0.5').replace('0.35', '0.5');
            ctx.lineWidth = 1;
            for (let i = -region.height; i < region.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(region.x + i, region.y);
                ctx.lineTo(region.x + i + region.height, region.y + region.height);
                ctx.stroke();
            }
            ctx.restore();

            // Label in center of region
            ctx.fillStyle = config.labelColor;
            ctx.textAlign = 'center';
            ctx.fillText(
                config.label,
                region.x + region.width / 2,
                region.y + region.height / 2,
            );
        }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
}

export const SAFE_ZONE_OPTIONS = Object.entries(SAFE_ZONE_CONFIGS).map(([id, cfg]) => ({
    id,
    label: cfg.label,
    labelColor: cfg.labelColor,
}));
