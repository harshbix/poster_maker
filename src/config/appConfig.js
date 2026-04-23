export const APP_META = {
    name: 'Poster Maker',
    title: 'Poster Maker | Social Poster Studio',
    tagline: 'Create sharp, export-ready social posters with smart layouts and precise image framing.',
    description: 'Poster Maker helps teams and creators build polished square and story posters with responsive text fitting, image framing controls, and fast PNG export.',
    keywords: 'poster maker, social media design, instagram poster, story maker, social graphics, content design',
};

export const FORMAT_OPTIONS = [
    { id: 'square', label: 'Square', sub: '1080 x 1080', description: 'Best for feed posts and static social graphics.' },
    { id: 'story', label: 'Story', sub: '1080 x 1920', description: 'Optimized for vertical stories and fullscreen placements.' },
];

export const DEFAULT_STATUS = {
    msg: 'Upload images or start with a headline to build your poster.',
    type: '',
};

export const TOAST_TIMEOUT_MS = 2600;

export const WORKSPACE_COPY = {
    sidebarIntro: 'Build your poster, fine-tune image framing, and shuffle layouts until everything locks into place.',
    previewReady: 'Preview renders at full 1080px resolution and scales down only for display.',
    previewEmpty: 'Start with a headline or upload images. The preview will update instantly as you design.',
};
