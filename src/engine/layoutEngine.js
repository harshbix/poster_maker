// ============================================================
// LAYOUT ENGINE — Intelligent poster layout generator
// Produces fully-described layout descriptors from images + text.
// No React, no DOM. Pure computation.
// ============================================================

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Always produces the same sequence for the same seed.
 */
function seededRng(seed) {
    let s = seed ^ 0xdeadbeef;
    return () => {
        s = Math.imul(s ^ (s >>> 15), s | 1);
        s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
        return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff;
    };
}

/**
 * Pick a random item from an array using an rng function.
 */
function pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
}

/**
 * Shuffle an array using Fisher-Yates with seeded rng.
 */
function shuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ============================================================
// LAYOUT DEFINITIONS
// Each layout is a function: (images, W, H, rng, theme) => descriptor
// descriptor = { id, zones: [...] }
// zone types: bg, image-hero, image-split, image-grid, image-strip,
//             overlay, headline, subtext, badge, brand, stripe
// ============================================================

/**
 * Zone helper: image zone descriptor.
 */
function imgZone(id, img, x, y, w, h, opts = {}) {
    return { type: 'image', id, img, x, y, w, h, anchorX: opts.anchorX ?? 0.5, anchorY: opts.anchorY ?? 0.35, ...opts };
}

/**
 * Overlay zone descriptor.
 */
function overlayZone(type, opts = {}) {
    return { type: 'overlay', subtype: type, ...opts };
}

/**
 * Text zone descriptors.
 */
function headlineZone(x, y, w, h, align = 'left') {
    return { type: 'headline', x, y, w, h, align };
}

function subtextZone(x, y, w, h, align = 'left') {
    return { type: 'subtext', x, y, w, h, align };
}

function badgeZone(x, y, label = 'NEWS') {
    return { type: 'badge', x, y, label };
}

function brandZone(x, y, align = 'right') {
    return { type: 'brand', x, y, align };
}

function stripeZone(x, y, w, h) {
    return { type: 'stripe', x, y, w, h };
}

// --------------------------------------------------------
// LAYOUT 1: hero-text-bottom (RapTV style — full-bleed hero, text lower third)
// Works perfectly with 1+ images
// --------------------------------------------------------
function layoutHeroTextBottom(images, W, H, rng) {
    const hero = images[0];
    const anchorX = 0.3 + rng() * 0.4;
    const anchorY = 0.15 + rng() * 0.25;
    const textPad = Math.round(W * 0.044);
    const stripeY = Math.round(H * (0.595 + rng() * 0.04));
    const headY = stripeY + Math.round(H * 0.025);
    const headH = Math.round(H * 0.31);
    const subY = headY + headH;
    const subH = Math.round(H * 0.08);

    const zones = [
        imgZone('hero', hero, 0, 0, W, H, { anchorX, anchorY, zIndex: 0 }),
    ];

    // Optional second image as circular inset (top right)
    if (images.length >= 2) {
        const r = Math.round(W * 0.13);
        zones.push({
            type: 'image-circle',
            id: 'inset',
            img: images[1],
            cx: W - r - Math.round(W * 0.044),
            cy: r + Math.round(H * 0.04),
            r,
            zIndex: 2,
        });
    }

    zones.push(
        overlayZone('vignette'),
        overlayZone('bottom-gradient', { startY: stripeY - Math.round(H * 0.15), height: H - stripeY + Math.round(H * 0.15) }),
        stripeZone(0, stripeY, W, 4),
        badgeZone(textPad, stripeY - Math.round(H * 0.045)),
        headlineZone(textPad, headY, W - textPad * 2, headH, 'left'),
        subtextZone(textPad, subY + 8, W - textPad * 2, subH, 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    );

    return { id: 'hero-text-bottom', label: 'Hero · Text Bottom', zones };
}

// --------------------------------------------------------
// LAYOUT 2: hero-split (left image, right dark panel)
// --------------------------------------------------------
function layoutHeroSplit(images, W, H, rng) {
    const hero = images[0];
    const splitX = Math.round(W * (0.48 + rng() * 0.10));
    const textPad = Math.round(W * 0.04);
    const textX = splitX + textPad;
    const textW = W - splitX - textPad * 2;
    const stripeH = 4;
    const stripeY = Math.round(H * (0.52 + rng() * 0.06));
    const headY = stripeY + 20;
    const headH = Math.round(H * 0.35);

    const zones = [
        imgZone('hero', hero, 0, 0, splitX, H, { anchorX: 0.5, anchorY: 0.3, zIndex: 0 }),
        { type: 'solid-bg', id: 'panel', x: splitX, y: 0, w: W - splitX, h: H, zIndex: 0 },
        overlayZone('side-fade', { splitX }),
        badgeZone(textX, Math.round(H * 0.05)),
        stripeZone(textX, stripeY, textW, stripeH),
        headlineZone(textX, headY, textW, headH, 'left'),
        subtextZone(textX, headY + headH + 8, textW, Math.round(H * 0.08), 'left'),
        brandZone(W - Math.round(W * 0.04), H - Math.round(H * 0.055)),
    ];

    if (images.length >= 2) {
        zones.push(imgZone('support', images[1], splitX + 4, 0, W - splitX - 4, Math.round(H * 0.38), { anchorX: 0.5, anchorY: 0.4, zIndex: 1, opacity: 0.35 }));
    }

    return { id: 'hero-split', label: 'Hero · Split Panel', zones };
}

// --------------------------------------------------------
// LAYOUT 3: dual-hero (two side-by-side images, text below)
// --------------------------------------------------------
function layoutDualHero(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const imgH = Math.round(H * (0.52 + rng() * 0.06));
    const gap = 4;
    const halfW = Math.floor((W - gap) / 2);
    const stripeY = imgH;
    const headY = stripeY + Math.round(H * 0.03);
    const headH = Math.round(H * 0.3);

    const hero = images[0];
    const second = images[1] || images[0];

    const zones = [
        imgZone('hero-l', hero, 0, 0, halfW, imgH, { anchorX: 0.5, anchorY: 0.3, zIndex: 0 }),
        imgZone('hero-r', second, halfW + gap, 0, halfW, imgH, { anchorX: 0.5, anchorY: 0.3, zIndex: 0 }),
        { type: 'solid-bg', id: 'textPanel', x: 0, y: imgH, w: W, h: H - imgH, zIndex: 0 },
        stripeZone(0, stripeY, W, 4),
        badgeZone(textPad, stripeY + Math.round(H * 0.025)),
        headlineZone(textPad, headY + Math.round(H * 0.04), W - textPad * 2, headH, 'left'),
        subtextZone(textPad, headY + Math.round(H * 0.04) + headH + 8, W - textPad * 2, Math.round(H * 0.07), 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    ];

    return { id: 'dual-hero', label: 'Dual Hero', zones };
}

// --------------------------------------------------------
// LAYOUT 4: grid-mosaic (hero top ~58%, grid strip bottom)
// --------------------------------------------------------
function layoutGridMosaic(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const heroH = Math.round(H * (0.5 + rng() * 0.06));
    const stripH = Math.round(H * 0.18);
    const gap = 3;
    const stripY = heroH + 4;
    const textY = stripY + stripH + Math.round(H * 0.02);
    const headH = Math.round(H * 0.25);

    const hero = images[0];
    const supporters = images.slice(1);
    const stripCount = Math.min(supporters.length, 3);
    const cellW = stripCount > 0 ? Math.floor((W - gap * (stripCount - 1)) / stripCount) : W;

    const zones = [
        imgZone('hero', hero, 0, 0, W, heroH, { anchorX: 0.5, anchorY: 0.3, zIndex: 0 }),
        overlayZone('vignette'),
        overlayZone('bottom-gradient', { startY: heroH - Math.round(H * 0.1), height: H - heroH + Math.round(H * 0.1) }),
    ];

    supporters.slice(0, 3).forEach((img, i) => {
        zones.push(imgZone(`strip-${i}`, img, i * (cellW + gap), stripY, cellW, stripH, { anchorX: 0.5, anchorY: 0.4, zIndex: 1 }));
    });

    zones.push(
        stripeZone(0, textY - 4, W, 4),
        badgeZone(textPad, textY - Math.round(H * 0.04)),
        headlineZone(textPad, textY, W - textPad * 2, headH, 'left'),
        subtextZone(textPad, textY + headH + 8, W - textPad * 2, Math.round(H * 0.07), 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    );

    return { id: 'grid-mosaic', label: 'Grid Mosaic', zones };
}

// --------------------------------------------------------
// LAYOUT 5: stacked-collage (overlapping images top half)
// --------------------------------------------------------
function layoutStackedCollage(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const collageH = Math.round(H * 0.52);
    const imgs = shuffle(images, rng).slice(0, 3);
    const baseW = Math.round(W * 0.55);
    const baseH = collageH;

    const zones = [
        overlayZone('solid-dark'),
    ];

    // Main large image (left-center)
    zones.push(imgZone('col-main', imgs[0], Math.round(W * 0.02), Math.round(H * 0.02), baseW, baseH - Math.round(H * 0.04), { anchorX: 0.5, anchorY: 0.3, zIndex: 1, outline: true }));

    // Second image (right, offset down)
    if (imgs[1]) {
        zones.push(imgZone('col-2', imgs[1], W - Math.round(W * 0.42), Math.round(H * 0.06), Math.round(W * 0.4), Math.round(H * 0.28), { anchorX: 0.5, anchorY: 0.3, zIndex: 2, outline: true }));
    }

    // Third image (right-bottom)
    if (imgs[2]) {
        zones.push(imgZone('col-3', imgs[2], W - Math.round(W * 0.38), Math.round(H * 0.28), Math.round(W * 0.36), Math.round(H * 0.24), { anchorX: 0.5, anchorY: 0.4, zIndex: 2, outline: true }));
    }

    const stripeY = collageH + Math.round(H * 0.02);
    const headY = stripeY + Math.round(H * 0.025);

    zones.push(
        stripeZone(0, stripeY, W, 4),
        badgeZone(textPad, stripeY - Math.round(H * 0.04)),
        headlineZone(textPad, headY, W - textPad * 2, Math.round(H * 0.32), 'left'),
        subtextZone(textPad, headY + Math.round(H * 0.32) + 8, W - textPad * 2, Math.round(H * 0.07), 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    );

    return { id: 'stacked-collage', label: 'Stacked Collage', zones };
}

// --------------------------------------------------------
// LAYOUT 6: centered-focus (image centered, letterbox)
// --------------------------------------------------------
function layoutCenteredFocus(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const barH = Math.round(H * (0.12 + rng() * 0.06));
    const imgH = H - barH * 2;

    const zones = [
        { type: 'solid-bg', id: 'topbar', x: 0, y: 0, w: W, h: barH, zIndex: 3 },
        { type: 'solid-bg', id: 'botbar', x: 0, y: H - barH, w: W, h: barH, zIndex: 3 },
        imgZone('hero', images[0], 0, barH, W, imgH, { anchorX: 0.5, anchorY: 0.3, zIndex: 0 }),
        overlayZone('vignette'),
        // text goes in bottom bar
        stripeZone(0, H - barH, Math.round(W * 0.004), barH),
        badgeZone(textPad, H - barH + Math.round(barH * 0.15)),
        headlineZone(textPad + Math.round(W * 0.09), H - barH + Math.round(barH * 0.08), W - textPad * 2 - Math.round(W * 0.09), barH * 0.8, 'left'),
        brandZone(W - textPad, barH * 0.5),
    ];

    return { id: 'centered-focus', label: 'Centered Focus', zones };
}

// --------------------------------------------------------
// LAYOUT 7: wide-strip (full-width image top, broad text bottom)
// --------------------------------------------------------
function layoutWideStrip(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const imgH = Math.round(H * (0.44 + rng() * 0.08));
    const textAreaH = H - imgH;
    const stripeY = imgH;
    const headY = stripeY + Math.round(textAreaH * 0.14);
    const headH = Math.round(textAreaH * 0.52);
    const subY = headY + headH + 8;

    const zones = [
        imgZone('hero', images[0], 0, 0, W, imgH, { anchorX: 0.5, anchorY: 0.35, zIndex: 0 }),
        overlayZone('vignette'),
        { type: 'solid-bg', id: 'textBg', x: 0, y: imgH, w: W, h: textAreaH, zIndex: 1 },
        stripeZone(0, stripeY, W, 4),
        badgeZone(textPad, stripeY + Math.round(textAreaH * 0.06)),
        headlineZone(textPad, headY, W - textPad * 2, headH, 'left'),
        subtextZone(textPad, subY, W - textPad * 2, Math.round(textAreaH * 0.2), 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    ];

    // Optional strip of extra images if available
    if (images.length >= 2) {
        const stripH = Math.round(H * 0.06);
        const stripCount = Math.min(images.length - 1, 4);
        const cw = Math.floor(W / stripCount);
        images.slice(1, 1 + stripCount).forEach((img, i) => {
            zones.splice(3, 0, imgZone(`strip-${i}`, img, i * cw, imgH - stripH, cw - 2, stripH, { anchorX: 0.5, anchorY: 0.5, zIndex: 2, opacity: 0.7 }));
        });
    }

    return { id: 'wide-strip', label: 'Wide Strip', zones };
}

// --------------------------------------------------------
// LAYOUT 8: full-overlay (single fullbleed, text center-bottom)
// --------------------------------------------------------
function layoutFullOverlay(images, W, H, rng) {
    const textPad = Math.round(W * 0.044);
    const anchorX = 0.3 + rng() * 0.4;
    const anchorY = 0.2 + rng() * 0.3;
    const stripeY = Math.round(H * (0.62 + rng() * 0.05));
    const headY = stripeY + 20;

    const zones = [
        imgZone('hero', images[0], 0, 0, W, H, { anchorX, anchorY, zIndex: 0 }),
        overlayZone('dark-overlay'),
        overlayZone('vignette'),
        overlayZone('bottom-gradient', { startY: stripeY - Math.round(H * 0.18), height: H - stripeY + Math.round(H * 0.18) }),
        stripeZone(0, stripeY, W, 4),
        badgeZone(textPad, stripeY - Math.round(H * 0.05)),
        headlineZone(textPad, headY, W - textPad * 2, Math.round(H * 0.3), 'left'),
        subtextZone(textPad, headY + Math.round(H * 0.3) + 8, W - textPad * 2, Math.round(H * 0.07), 'left'),
        brandZone(W - textPad, Math.round(H * 0.038)),
    ];

    return { id: 'full-overlay', label: 'Full Overlay', zones };
}

// ============================================================
// LAYOUT SELECTION MATRIX
// Maps (imageCount, preferredLayouts) for smart selection
// ============================================================

const ALL_LAYOUTS = [
    'hero-text-bottom',
    'hero-split',
    'dual-hero',
    'grid-mosaic',
    'stacked-collage',
    'centered-focus',
    'wide-strip',
    'full-overlay',
];

function selectableLayouts(count) {
    if (count === 0) return ['full-overlay', 'hero-text-bottom'];
    if (count === 1) return ['hero-text-bottom', 'full-overlay', 'centered-focus', 'wide-strip', 'hero-split'];
    if (count === 2) return ['hero-text-bottom', 'dual-hero', 'hero-split', 'wide-strip', 'full-overlay', 'stacked-collage'];
    return ALL_LAYOUTS; // 3+ images get all layouts
}

const LAYOUT_FNS = {
    'hero-text-bottom': layoutHeroTextBottom,
    'hero-split': layoutHeroSplit,
    'dual-hero': layoutDualHero,
    'grid-mosaic': layoutGridMosaic,
    'stacked-collage': layoutStackedCollage,
    'centered-focus': layoutCenteredFocus,
    'wide-strip': layoutWideStrip,
    'full-overlay': layoutFullOverlay,
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Generate a poster layout descriptor.
 *
 * @param {HTMLImageElement[]} images - Array of loaded images (may be empty)
 * @param {{ headline, subtext, brandName }} text
 * @param {{ seed: number, format: 'square'|'story', history: string[] }} opts
 * @returns {{ id, label, zones: object[] }}
 */
export function generateLayout(images, text, { seed = 0, format = 'square', history = [] } = {}) {
    const W = 1080;
    const H = format === 'story' ? 1920 : 1080;

    const rng = seededRng(seed);

    // Get candidate layouts based on image count
    let candidates = selectableLayouts(images.length);

    // Filter out recently used layouts (avoid repeats for last 2)
    const recent = history.slice(-2);
    const filtered = candidates.filter(id => !recent.includes(id));
    if (filtered.length > 0) candidates = filtered;

    // Pick one based on rng
    const layoutId = pick(candidates, rng);
    const layoutFn = LAYOUT_FNS[layoutId];

    // If images empty, use a placeholder "no image" layout
    const safeImages = images.length > 0 ? images : [null];

    return layoutFn(safeImages, W, H, rng, text);
}

/**
 * Returns a new seed value based on an incrementing counter.
 * Simple utility used by the App to generate a new layout each shuffle.
 */
export function nextSeed(current) {
    return (current + 1 + Math.floor(Math.random() * 97)) | 0;
}
