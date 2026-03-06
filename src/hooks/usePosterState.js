import { useState, useCallback, useRef } from 'react';
import { nextSeed } from '../engine/layoutEngine.js';

export const INITIAL_STATE = {
    images: [],
    layoutSeed: 1,
    layoutHistory: [],
    currentLayoutLabel: '',
    headline: '*MANCHESTER CITY* IN DANGER OF RELEGATION FROM THE EPL',
    subtext: 'Club sits 15th with 8 consecutive losses this season',
    brandName: 'FAROLS',
    customBadge: 'NEWS',
    style: 'dark-blue',
    accentColor: '#00d4ff',
    format: 'square',
};

let _imgIdCounter = 0;

export function usePosterState() {
    const [state, setState] = useState(INITIAL_STATE);
    const stateRef = useRef(INITIAL_STATE); // always current
    const renderRef = useRef(null);           // imperative canvas render fn

    /** CanvasArea registers its render fn here once on mount */
    const setRenderFn = useCallback((fn) => {
        renderRef.current = fn;
    }, []);

    /** Apply a patch to stateRef and React state — NO canvas repaint */
    const set = useCallback((patch) => {
        const next = { ...stateRef.current, ...patch };
        stateRef.current = next;
        setState(next);
    }, []);

    /** Apply a patch AND immediately repaint the canvas */
    const update = useCallback((patch) => {
        const next = { ...stateRef.current, ...patch };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    /** Image loaded → update React state (for chips) + repaint immediately */
    const addImageFromFile = useCallback((file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            const id = `img_${++_imgIdCounter}`;
            img.onload = () => {
                const images = [...stateRef.current.images, { img, src: ev.target.result, id }];
                const next = { ...stateRef.current, images };
                stateRef.current = next;
                setState(next);
                renderRef.current?.(next); // render immediately — no React cycle
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }, []);

    const addMultipleImages = useCallback((files) => {
        Array.from(files).forEach(addImageFromFile);
    }, [addImageFromFile]);

    const removeImage = useCallback((id) => {
        const images = stateRef.current.images.filter(i => i.id !== id);
        const next = { ...stateRef.current, images };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    const shuffle = useCallback(() => {
        const prev = stateRef.current;
        const newSeed = nextSeed(prev.layoutSeed);
        const history = [...(prev.layoutHistory || []), prev.currentLayoutLabel].slice(-3);
        const next = { ...prev, layoutSeed: newSeed, layoutHistory: history };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    /** Called by CanvasArea after each render to cache the layout label */
    const setLayoutLabel = useCallback((label) => {
        stateRef.current = { ...stateRef.current, currentLayoutLabel: label };
        // No setState needed — only status bar text uses this
    }, []);

    return { state, stateRef, set, update, setRenderFn, addImageFromFile, addMultipleImages, removeImage, shuffle, setLayoutLabel };
}
