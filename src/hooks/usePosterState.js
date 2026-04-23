import { useState, useCallback, useRef } from 'react';
import { nextSeed } from '../engine/layoutEngine.js';

export const INITIAL_STATE = {
    images: [],
    layoutSeed: 1,
    layoutHistory: [],
    currentLayoutLabel: '',
    headline: '',
    subtext: '',
    brandName: '',
    customBadge: 'Top Story',
    style: 'dark-blue',
    accentColor: '#00d4ff',
    format: 'square',
};

let _imgIdCounter = 0;

const DEFAULT_IMAGE_ADJUSTMENTS = {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
};

function isImageFile(file) {
    return Boolean(file?.type?.startsWith('image/'));
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Missing file.'));
            return;
        }

        if (!isImageFile(file)) {
            reject(new Error(`"${file.name}" is not an image file.`));
            return;
        }

        const reader = new FileReader();

        reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
        reader.onload = (ev) => {
            const img = new Image();
            const id = `img_${++_imgIdCounter}`;

            img.onload = () => resolve({
                img,
                id,
                src: ev.target?.result,
                name: file.name,
                ...DEFAULT_IMAGE_ADJUSTMENTS,
            });

            img.onerror = () => reject(new Error(`Could not load "${file.name}" as an image.`));
            img.src = ev.target?.result;
        };

        reader.readAsDataURL(file);
    });
}

export function usePosterState() {
    const [state, setState] = useState(INITIAL_STATE);
    const stateRef = useRef(INITIAL_STATE);
    const renderRef = useRef(null);

    const setRenderFn = useCallback((fn) => {
        renderRef.current = fn;
    }, []);

    const update = useCallback((patch) => {
        const next = { ...stateRef.current, ...patch };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    const addImageFromFile = useCallback(async (file) => {
        const imageItem = await loadImageFromFile(file);
        const images = [...stateRef.current.images, imageItem];
        const next = { ...stateRef.current, images };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
        return imageItem;
    }, []);

    const addMultipleImages = useCallback(async (files) => {
        const incomingFiles = Array.from(files ?? []);
        const results = await Promise.allSettled(incomingFiles.map(loadImageFromFile));
        const added = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
        const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => result.reason?.message || 'Image import failed.');

        if (added.length > 0) {
            const images = [...stateRef.current.images, ...added];
            const next = { ...stateRef.current, images };
            stateRef.current = next;
            setState(next);
            renderRef.current?.(next);
        }

        return { added, errors };
    }, []);

    const removeImage = useCallback((id) => {
        const images = stateRef.current.images.filter(i => i.id !== id);
        const next = { ...stateRef.current, images };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    const updateImageAdjustments = useCallback((id, patch) => {
        const images = stateRef.current.images.map((image) => (
            image.id === id ? { ...image, ...patch } : image
        ));
        const next = { ...stateRef.current, images };
        stateRef.current = next;
        setState(next);
        renderRef.current?.(next);
    }, []);

    const resetImageAdjustments = useCallback((id) => {
        const images = stateRef.current.images.map((image) => (
            image.id === id ? { ...image, ...DEFAULT_IMAGE_ADJUSTMENTS } : image
        ));
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

    const setLayoutLabel = useCallback((label) => {
        stateRef.current = { ...stateRef.current, currentLayoutLabel: label };
    }, []);

    return {
        state,
        stateRef,
        update,
        setRenderFn,
        addImageFromFile,
        addMultipleImages,
        removeImage,
        updateImageAdjustments,
        resetImageAdjustments,
        shuffle,
        setLayoutLabel,
    };
}
