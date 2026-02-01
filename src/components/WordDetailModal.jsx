import { useState, useEffect } from 'react';

function WordDetailModal({ word, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Clean the word for API (remove parts of speech like " (n)")
    const cleanWord = word.replace(/\s*\(.*?\)\s*/g, '').trim();

    useEffect(() => {
        if (!cleanWord) return;

        setLoading(true);
        setError(null);

        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
            .then(res => {
                if (!res.ok) throw new Error('Word not found');
                return res.json();
            })
            .then(data => {
                setData(data); // Store ALL entries array
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Could not load word details.');
                setLoading(false);
            });
    }, [cleanWord]);

    const playAudio = () => {
        // Find first valid audio in ANY entry
        const apiAudio = data?.flatMap(d => d.phonetics).find(p => p.audio)?.audio;

        if (apiAudio) {
            new Audio(apiAudio).play();
        } else {
            const utterance = new SpeechSynthesisUtterance(cleanWord);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{cleanWord}</h2>

                    {loading ? (
                        <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {data?.phonetic && (
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-sm">
                                    {data.phonetic}
                                </span>
                            )}
                            <button
                                onClick={playAudio}
                                className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                                title="Listen"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            </button>
                        </div>
                    )}
                </div>

                {error ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>{error}</p>
                        <p className="text-sm mt-2">Try checking your internet connection.</p>
                    </div>
                ) : loading ? (
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Meanings */}
                        {(() => {
                            // 1. Aggregate meanings from ALL entries
                            const allMeanings = data.flatMap(entry => entry.meanings || []);

                            // 2. Parse tags from the word string (e.g., "Cook (v/n)") -> ['verb', 'noun']
                            const tagMatch = word.match(/\((.*?)\)/);
                            const tagMap = {
                                'n': 'noun',
                                'v': 'verb',
                                'adj': 'adjective',
                                'adv': 'adverb',
                                'prep': 'preposition',
                                'pron': 'pronoun',
                                'conj': 'conjunction',
                                'interj': 'interjection'
                            };

                            // Map short tags to full API POS names
                            const allowedPOS = tagMatch
                                ? tagMatch[1].split('/').map(t => tagMap[t.trim()] || t.trim())
                                : [];

                            // 3. Group definitions by POS
                            // structure: { noun: [def1, def2...], verb: [def1...] }
                            const definitionsByPOS = {};

                            allMeanings.forEach(m => {
                                if (!definitionsByPOS[m.partOfSpeech]) {
                                    definitionsByPOS[m.partOfSpeech] = [];
                                }
                                // Add all definitions from this meaning block
                                definitionsByPOS[m.partOfSpeech].push(...m.definitions);
                            });

                            // 4. Determine which POS to show
                            // If we have specific tags, iterate those. Else, show all available keys.
                            const posToShow = (allowedPOS.length > 0)
                                ? allowedPOS.filter(pos => definitionsByPOS[pos]) // only those that actually exist in API
                                : Object.keys(definitionsByPOS);

                            if (posToShow.length === 0 && allowedPOS.length > 0) {
                                // Fallback: If strict mapping failed (rare), show everything
                                return allMeanings.slice(0, 3).map((m, i) => (
                                    <div key={i} className="mb-4">
                                        <span className="text-xs font-bold uppercase text-gray-400">{m.partOfSpeech}</span>
                                        <p>{m.definitions[0]?.definition}</p>
                                    </div>
                                ));
                            }

                            return posToShow.map((pos) => (
                                <div key={pos} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded mb-2">
                                        {pos}
                                    </span>
                                    <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                                        {definitionsByPOS[pos].slice(0, 2).map((def, idx) => (
                                            <li key={idx} className="text-base leading-relaxed">
                                                <span>{def.definition}</span>
                                                {def.example && (
                                                    <p className="mt-1 ml-5 text-sm italic text-gray-500 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                                                        "{def.example}"
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-gray-400">
                    Original: {word}
                </div>
            </div>
        </div>
    );
}

export default WordDetailModal;
