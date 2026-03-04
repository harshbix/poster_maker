import { useState, useCallback } from 'react';

export const INITIAL_STATE = {
    bgImage: null,
    bgTransform: { x: 0.5, y: 0.5, scale: 1 },
    thumbImage: null,
    thumbTransform: { x: 0.5, y: 0.5, scale: 1 },
    logoImage: null,
    style: 'dark-blue',
    accentColor: '#00d4ff',
    format: 'square',
    headline: '*MANCHESTER CITY* IN DANGER OF RELEGATION FROM THE EPL',
    subtext: 'Club sits 15th with 8 consecutive losses this season',
    brandName: 'FAROLS',
    rendered: false,
    showFilters: true,
};

export function usePosterState() {
    const [state, setState] = useState(INITIAL_STATE);

    const update = useCallback((patch) => {
        setState(prev => ({ ...prev, ...patch }));
    }, []);

    const loadImageFromFile = useCallback((file, type) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => update({
                [`${type}Image`]: img,
                [`${type}Transform`]: { x: 0.5, y: 0.5, scale: 1 }
            });
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }, [update]);

    return { state, update, loadImageFromFile };
}
