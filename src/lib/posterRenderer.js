// ============================================================
// POSTER RENDERING — Pure canvas drawing logic
// ============================================================

export const STYLES = {
    'dark-blue': { bg: '#0a1628', overlay: 'rgba(5,15,35,0.72)', stripe: '#00d4ff', textMain: '#ffffff', textAccent: '#00d4ff' },
    'black-red': { bg: '#0d0000', overlay: 'rgba(10,0,0,0.75)', stripe: '#ff3c5f', textMain: '#ffffff', textAccent: '#ff3c5f' },
    'white-punch': { bg: '#f0f0f0', overlay: 'rgba(240,240,240,0.55)', stripe: '#111', textMain: '#111111', textAccent: '#111111' },
    'gold-black': { bg: '#0a0900', overlay: 'rgba(8,7,0,0.78)', stripe: '#ffd600', textMain: '#ffffff', textAccent: '#ffd600' },
};

export const COLOR_SWATCHES = [
    '#00d4ff', '#ff3c5f', '#ffd600', '#00e676',
    '#ff6d00', '#d500f9', '#ffffff',
];

export const STYLE_OPTIONS = [
    { id: 'dark-blue', label: 'Dark Blue', sub: 'Like your sample', color: '#00d4ff' },
    { id: 'black-red', label: 'Black Red', sub: 'Breaking news', color: '#ff3c5f' },
    { id: 'white-punch', label: 'White Punch', sub: 'Clean editorial', color: '#f0f0f0' },
    { id: 'gold-black', label: 'Gold Black', sub: 'Premium feel', color: '#ffd600' },
];

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    });
    if (current) lines.push(current);
    return lines;
}

export function renderPoster({ canvas, state }) {
    const ctx = canvas.getContext('2d');
    const { bgImage, bgTransform, thumbImage, thumbTransform, logoImage, style, accentColor, format, headline, subtext, brandName } = state;

    const isStory = format === 'story';
    const W = 1080;
    const H = isStory ? 1920 : 1080;
    canvas.width = W;
    canvas.height = H;

    const theme = { ...STYLES[style], stripe: accentColor };

    // ---- BG ----
    if (bgImage) {
        const img = bgImage;
        const ir = img.width / img.height;
        const cr = W / H;

        let baseScale = 1;
        if (ir > cr) { baseScale = H / img.height; }
        else { baseScale = W / img.width; }

        const scale = baseScale * (bgTransform?.scale || 1);
        const dw = img.width * scale;
        const dh = img.height * scale;

        const px = bgTransform?.x ?? 0.5;
        const py = bgTransform?.y ?? 0.5;

        const dx = (W - dw) * px;
        const dy = (H - dh) * py;

        ctx.drawImage(img, dx, dy, dw, dh);
    } else {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, theme.bg);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ---- DARK FILTERS (TOGGLEABLE) ----
    if (state.showFilters !== false) {
        // ---- DARK OVERLAY ----
        ctx.fillStyle = theme.overlay;
        ctx.fillRect(0, 0, W, H);

        // ---- VIGNETTE ----
        const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // ---- BOTTOM GRADIENT ----
        const bottomH = isStory ? 700 : 460;
        const bottomGrad = ctx.createLinearGradient(0, H - bottomH, 0, H);
        bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bottomGrad.addColorStop(0.4, 'rgba(0,0,0,0.85)');
        bottomGrad.addColorStop(1, 'rgba(0,0,0,0.97)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, H - bottomH, W, bottomH);
    }

    // ---- THUMBNAIL (if provided) ----
    if (thumbImage) {
        const thumbSize = isStory ? 320 : 260;
        const tx = W - thumbSize - 48;
        const ty = isStory ? 140 : 60;

        ctx.save();
        ctx.beginPath();
        ctx.arc(tx + thumbSize / 2, ty + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
        ctx.clip();

        const ti = thumbImage;
        const ir = ti.width / ti.height;
        let baseScale = 1;
        if (ir > 1) { baseScale = thumbSize / ti.height; }
        else { baseScale = thumbSize / ti.width; }

        const scale = baseScale * (thumbTransform?.scale || 1);
        const dw = ti.width * scale;
        const dh = ti.height * scale;

        const px = thumbTransform?.x ?? 0.5;
        const py = thumbTransform?.y ?? 0.5;

        const dx = tx + (thumbSize - dw) * px;
        const dy = ty + (thumbSize - dh) * py;

        ctx.drawImage(ti, dx, dy, dw, dh);
        ctx.restore();

        ctx.strokeStyle = theme.stripe;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(tx + thumbSize / 2, ty + thumbSize / 2, thumbSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    // ---- ACCENT STRIPE ----
    const stripeY = isStory ? H - 420 : H - 320;
    ctx.fillStyle = theme.stripe;
    ctx.fillRect(0, stripeY, W, 4);

    // ---- BRAND NAME ----
    const brandFont = isStory ? 32 : 26;
    ctx.font = `700 ${brandFont}px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = theme.stripe;

    const brandMeasure = ctx.measureText(brandName).width;
    const brandW = brandMeasure + 40;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W - brandW - 32, stripeY - brandFont - 10, brandW, brandFont + 16);
    ctx.fillStyle = theme.stripe;
    ctx.textAlign = 'right';
    ctx.fillText(brandName, W - 44, stripeY - 12);
    ctx.textAlign = 'left';

    // ---- LOGO ----
    if (logoImage) {
        const lH = isStory ? 60 : 48;
        const lW = logoImage.width * (lH / logoImage.height);
        ctx.globalAlpha = 0.92;
        ctx.drawImage(logoImage, W - lW - 32, H - lH - 32, lW, lH);
        ctx.globalAlpha = 1;
    }

    // ---- HEADLINE ----
    const pad = 48;
    const textY = stripeY + 28;
    const maxWText = W - pad * 2;

    const headlineUpper = headline.toUpperCase();
    const fontSize = isStory ? 108 : 88;
    ctx.font = `900 ${fontSize}px 'Barlow Condensed', sans-serif`;

    const lines = wrapText(ctx, headlineUpper, maxWText);

    let currentY = textY + fontSize;
    lines.forEach((line) => {
        const words = line.split(' ');
        const lineWidth = ctx.measureText(line.replace(/\*/g, '')).width; // measure without asterisks
        let x = pad + (maxWText - lineWidth) / 2; // Center alignment

        words.forEach((word) => {
            const isKey = word.includes('*'); // manual highlight trigger
            const cleanWord = word.replace(/\*/g, ''); // strip for drawing

            ctx.fillStyle = isKey ? theme.stripe : theme.textMain;
            ctx.fillText(cleanWord + ' ', x, currentY);
            x += ctx.measureText(cleanWord + ' ').width; // Add space incrementally
        });
        currentY += fontSize * 1.05;
    });

    // ---- SUBTEXT ----
    if (subtext) {
        const subSize = isStory ? 38 : 30;
        ctx.font = `500 ${subSize}px 'Barlow', sans-serif`;
        ctx.fillStyle = 'rgba(240,240,240,0.72)';
        const subLines = wrapText(ctx, subtext, maxWText);
        subLines.forEach((line, i) => {
            const lineWidth = ctx.measureText(line).width;
            const x = pad + (maxWText - lineWidth) / 2; // Center alignment
            ctx.fillText(line, x, currentY + 16 + (subSize * 1.3 * i));
        });
    }
}
