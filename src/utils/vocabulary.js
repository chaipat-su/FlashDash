import { vocabularyData } from '../data';

export const getLevels = () => {
    return Object.keys(vocabularyData);
};

export const getLevelData = (level) => {
    const levelData = vocabularyData[level];
    if (!levelData) return [];

    // Shuffle and pick 6 words
    return [...levelData].sort(() => 0.5 - Math.random()).slice(0, 6);
};
