export const cleanWordForAudio = (text) => {
    return text.replace(/\s*\(.*?\)\s*/g, '').trim();
};

export const playAudio = async (text) => {
    const word = cleanWordForAudio(text);

    try {
        // Try to get natural audio from API
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (res.ok) {
            const data = await res.json();
            // Find first valid audio in ANY entry
            const apiAudio = data.flatMap(d => d.phonetics || []).find(p => p.audio)?.audio;

            if (apiAudio) {
                new Audio(apiAudio).play();
                return;
            }
        }
    } catch (e) {
        console.warn("Audio fetch failed, falling back to TTS", e);
    }

    // Fallback to robotic TTS
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};
