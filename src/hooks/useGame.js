import { useState, useEffect } from 'react';
import { getLevelData } from '../utils/vocabulary';

export function useGame() {
    const [currentLevel, setCurrentLevel] = useState(null);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [gameStatus, setGameStatus] = useState('idle'); // idle, playing, won
    const [timer, setTimer] = useState(0);
    const [timerIntervalId, setTimerIntervalId] = useState(null);
    const [playedWords, setPlayedWords] = useState([]);
    const [bestTimes, setBestTimes] = useState({});

    // 1. Load best times on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('flashdash-best-times');
            if (saved) {
                setBestTimes(JSON.parse(saved));
            }
        }
    }, []);

    // 2. Timer Logic
    useEffect(() => {
        if (gameStatus === 'playing') {
            const id = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
            setTimerIntervalId(id);
        } else {
            if (timerIntervalId) clearInterval(timerIntervalId);
        }

        return () => {
            if (timerIntervalId) clearInterval(timerIntervalId);
        };
    }, [gameStatus]);

    // 3. Helper: Update Best Time
    const updateBestTime = (level, time) => {
        setBestTimes(prev => {
            const currentBest = prev[level];
            if (!currentBest || time < currentBest) {
                const newBestTimes = { ...prev, [level]: time };
                localStorage.setItem('flashdash-best-times', JSON.stringify(newBestTimes));
                return newBestTimes;
            }
            return prev;
        });
    };

    // 4. Start Game
    const startGame = (level) => {
        const shuffledData = getLevelData(level);

        setPlayedWords(shuffledData); // Store the words for this round

        const gameCards = [];
        shuffledData.forEach((item, index) => {
            gameCards.push({
                id: `en-${index}`,
                pairId: index,
                content: item.en,
                lang: 'en',
                isFlipped: false,
                isMatched: false,
                isShaking: false,
                isCorrect: false
            });
            gameCards.push({
                id: `th-${index}`,
                pairId: index,
                content: item.th,
                lang: 'th',
                isFlipped: false,
                isMatched: false,
                isShaking: false,
                isCorrect: false
            });
        });

        gameCards.sort(() => 0.5 - Math.random());

        setCards(gameCards);
        setCurrentLevel(level);
        setMatchedPairs(0);
        setFlippedCards([]);
        setTimer(0);
        setGameStatus('playing');
    };

    // 5. Card Interaction
    const handleCardClick = (clickedCard) => {
        if (
            gameStatus !== 'playing' ||
            clickedCard.isMatched ||
            clickedCard.isFlipped ||
            clickedCard.isCorrect ||
            flippedCards.length >= 2
        ) {
            return;
        }

        const newCards = cards.map(card =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card
        );
        setCards(newCards);

        const newFlippedCards = [...flippedCards, clickedCard];
        setFlippedCards(newFlippedCards);

        if (newFlippedCards.length === 2) {
            checkForMatch(newFlippedCards, newCards);
        }
    };

    const checkForMatch = (currentFlipped, currentCards) => {
        const [card1, card2] = currentFlipped;
        const isMatch = card1.pairId === card2.pairId;

        if (isMatch) {
            // Mark correct
            const correctCards = currentCards.map(card =>
                (card.id === card1.id || card.id === card2.id)
                    ? { ...card, isCorrect: true, isFlipped: true }
                    : card
            );
            setCards(correctCards);

            const isLastMatch = matchedPairs === 5; // 6 pairs standard, logic checks existing state (0) + 1 ... wait, matchedPairs state is updated async.
            // Logic from App.jsx: const isLastMatch = matchedPairs === 5; (0 based? no, start 0. pairs 6 total.)
            // App.jsx used matchedPairs state directly. here we use logic similar to App.jsx.

            const delay = matchedPairs === 5 ? 1000 : 500;

            setTimeout(() => {
                const matchedCards = correctCards.map(card =>
                    (card.id === card1.id || card.id === card2.id)
                        ? { ...card, isMatched: true }
                        : card
                );
                setCards(matchedCards);
                setFlippedCards([]);

                setMatchedPairs(prev => {
                    const newCount = prev + 1;
                    if (newCount === 6) {
                        setGameStatus('won');
                        updateBestTime(currentLevel, timer); // Use current timer state. Ideally pass in value to avoid closure staleness if any? Timer state updates every second.
                        // In App.jsx: updateBestTime(currentLevel, timer). 
                        // NOTE: Closure issue potential? If this runs in setTimeout, 'timer' is from closure scope of render cycle where checkForMatch was called.
                        // This is acceptable typically.
                    }
                    return newCount;
                });
            }, delay);
        } else {
            // Wrong match
            const shakenCards = currentCards.map(card =>
                (card.id === card1.id || card.id === card2.id)
                    ? { ...card, isShaking: true }
                    : card
            );
            setCards(shakenCards);

            setTimeout(() => {
                setCards(prevCards =>
                    prevCards.map(card =>
                        (card.id === card1.id || card.id === card2.id)
                            ? { ...card, isFlipped: false, isShaking: false }
                            : card
                    )
                );
                setFlippedCards([]);
            }, 1000);
        }
    };

    const resetGame = () => {
        setGameStatus('idle');
        setCurrentLevel(null);
        setTimer(0);
        setPlayedWords([]);
    };

    return {
        gameStatus,
        currentLevel,
        cards,
        timer,
        matchedPairs,
        bestTimes,
        playedWords,
        startGame,
        handleCardClick,
        resetGame
    };
}
