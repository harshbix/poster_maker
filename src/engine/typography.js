// ============================================================
// TYPOGRAPHY ENGINE
// Binary-search font scaling + multi-line word wrap
// ============================================================

/**
 * @typedef {Object} TypographyConstraints
 * @property {string}  fontFamily
 * @property {number}  fontWeight
 * @property {number}  minSize
 * @property {number}  maxSize
 * @property {number}  maxLines       - hard cap; ellipsis applied on last if exceeded
 * @property {number}  lineHeight     - multiplier e.g. 1.05
 * @property {string}  [transform]    - 'uppercase' | 'none'
 * @property {number}  [letterSpacing]
 */

/**
 * @typedef {Object} TextZone
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} FitResult
 * @property {string[]} lines
 * @property {number}   fontSize
 * @property {boolean}  overflow  - true if text was truncated
 */

/**
 * Build a CSS font string for canvas.
 * @param {number} size
 * @param {TypographyConstraints} c
 */
function buildFont(size, c) {
    return `${c.fontWeight} ${size}px '${c.fontFamily}', sans-serif`;
}

/**
 * Word-wrap text into lines that fit within maxWidth at the current canvas font.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} maxLines
 * @returns {string[]}
 */
function wrapWords(ctx, text, maxWidth, maxLines) {
    const words = text.split(' ').filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && current) {
            lines.push(current);
            current = word;
            if (lines.length >= maxLines) break;
        } else {
            current = candidate;
        }
    }

    if (current && lines.length < maxLines) lines.push(current);
    return lines;
}

/**
 * Apply ellipsis to the last line if it overflows maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} line
 * @param {number} maxWidth
 */
function ellipsize(ctx, line, maxWidth) {
    if (ctx.measureText(line).width <= maxWidth) return line;
    let truncated = line;
    while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1).trimEnd();
    }
    return `${truncated}…`;
}

/**
 * Fit text into a zone using binary search for the best font size.
 * Returns the optimal lines + fontSize. Never throws — always returns usable output.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {TextZone} zone
 * @param {TypographyConstraints} constraints
 * @returns {FitResult}
 */
export function fitText(ctx, text, zone, constraints) {
    const { minSize, maxSize, maxLines, lineHeight, fontFamily, fontWeight, transform } = constraints;
    const displayText = transform === 'uppercase' ? text.toUpperCase() : text;
    const maxW = zone.width;
    const maxH = zone.height;

    let lo = minSize;
    let hi = maxSize;
    let bestSize = minSize;
    let bestLines = [displayText];

    // Binary search for the largest font that fits both width and height
    for (let iter = 0; iter < 20; iter++) {
        if (hi - lo < 0.5) break;
        const mid = (lo + hi) / 2;
        ctx.font = buildFont(mid, { fontFamily, fontWeight });
        const lines = wrapWords(ctx, displayText, maxW, maxLines);
        const totalH = lines.length * mid * lineHeight;
        const widthOk = lines.every(l => ctx.measureText(l).width <= maxW);

        if (totalH <= maxH && widthOk) {
            bestSize = mid;
            bestLines = lines;
            lo = mid; // fits — try bigger
        } else {
            hi = mid; // overflows — try smaller
        }
    }

    // Final check — apply ellipsis if last line still overflows
    ctx.font = buildFont(bestSize, { fontFamily, fontWeight });
    const correctedLines = bestLines.map((line, i) =>
        i === bestLines.length - 1 ? ellipsize(ctx, line, maxW) : line
    );

    const overflow = correctedLines.some(l => l.endsWith('…'));
    return { lines: correctedLines, fontSize: bestSize, overflow };
}

/**
 * Measure total rendered height of a fit result.
 */
export function measuredHeight({ lines, fontSize }, lineHeightMultiplier) {
    return lines.length * fontSize * lineHeightMultiplier;
}

/**
 * Draw fitted text into a zone with optional per-word alternate coloring.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {FitResult}               fit
 * @param {TextZone}                zone
 * @param {TypographyConstraints}   constraints
 * @param {{ main: string, accent: string }} colors
 * @param {boolean}                 alternateWords
 */
export function drawFittedText(ctx, fit, zone, constraints, colors, alternateWords = false) {
    const { lines, fontSize } = fit;
    const { fontFamily, fontWeight, lineHeight, align = 'left' } = constraints;
    ctx.font = buildFont(fontSize, { fontFamily, fontWeight });
    ctx.textAlign = align;
    ctx.textBaseline = 'top';

    const startX = align === 'right' ? zone.x + zone.width : zone.x;

    lines.forEach((line, li) => {
        const y = zone.y + li * fontSize * lineHeight;
        if (alternateWords) {
            const words = line.split(' ');
            let x = zone.x;
            ctx.textAlign = 'left';
            words.forEach((word, wi) => {
                // Alternate between main and accent per word (line 0: word-level; line N: line-level)
                const useAccent = li === 0 ? wi % 2 === 1 : li % 2 === 1;
                ctx.fillStyle = useAccent ? colors.accent : colors.main;
                const drawn = word + (wi < words.length - 1 ? ' ' : '');
                ctx.fillText(drawn, x, y);
                x += ctx.measureText(drawn).width;
            });
        } else {
            ctx.fillStyle = colors.main;
            ctx.fillText(line, startX, y);
        }
    });

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}
