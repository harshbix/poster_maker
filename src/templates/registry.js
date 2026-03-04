// ============================================================
// TEMPLATE REGISTRY
// Loads all templates and resolves format-specific zone configs.
// ============================================================

import darkBlue from './dark-blue.json';
import blackRed from './black-red.json';
import whitePunch from './white-punch.json';
import goldBlack from './gold-black.json';

export const TEMPLATE_REGISTRY = {
    'dark-blue': darkBlue,
    'black-red': blackRed,
    'white-punch': whitePunch,
    'gold-black': goldBlack,
};

export const TEMPLATE_LIST = Object.values(TEMPLATE_REGISTRY);

/**
 * Resolve a template for a specific format.
 * Merges format-specific zone overrides into the base template shape.
 *
 * @param {string} templateId
 * @param {'square'|'story'} format
 * @returns {Object} - flat template ready for renderer consumption
 */
export function getTemplate(templateId, format) {
    const base = TEMPLATE_REGISTRY[templateId];
    if (!base) {
        console.warn(`[TemplateRegistry] Unknown template: ${templateId}. Falling back to dark-blue.`);
        return getTemplate('dark-blue', format);
    }

    const formatConfig = base.formats?.[format];
    if (!formatConfig) {
        console.warn(`[TemplateRegistry] Template "${templateId}" has no config for format "${format}". Falling back to square.`);
        return getTemplate(templateId, 'square');
    }

    return {
        id: base.id,
        name: base.name,
        format,
        defaultAccent: base.defaultAccent,
        theme: base.theme,
        overlays: base.overlays || [],
        zones: formatConfig.zones,
        width: formatConfig.width,
        height: formatConfig.height,
    };
}

/**
 * Get all templates that support a given format.
 */
export function getTemplatesForFormat(format) {
    return TEMPLATE_LIST.filter(t => t.formats?.[format]);
}

export const COLOR_SWATCHES = [
    '#00d4ff', '#ff3c5f', '#ffd600', '#00e676',
    '#ff6d00', '#d500f9', '#ffffff',
];
