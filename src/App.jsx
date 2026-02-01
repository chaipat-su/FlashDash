import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { playAudio } from './utils/audio';
import { getLevels } from './utils/vocabulary';
import WordDetailModal from './components/WordDetailModal';
import './App.css';

function App() {
  // Game State Hooks
  const {
    gameStatus,
    currentLevel,
    cards,
    timer,
    bestTimes,
    playedWords,
    startGame,
    handleCardClick,
    resetGame,
    matchedPairs
  } = useGame();

  const [selectedWord, setSelectedWord] = useState(null); // UI State

  // Theme State (UI Only)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('flashdash-theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('flashdash-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen w-full transition-colors duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">

      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          {gameStatus !== 'idle' && (
            <button
              onClick={resetGame}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 cursor-pointer"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            FlashDash
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {gameStatus !== 'idle' && (
            <div className="font-mono text-xl font-medium px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {formatTime(timer)}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12 grow flex flex-col">
        {gameStatus === 'idle' ? (
          <section aria-label="Level Selection" className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
            <div className="text-center mb-16 max-w-xl">
              <h2 className="text-4xl font-extrabold mb-6 text-gray-900 dark:text-white">Review Vocabulary</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Choose a difficulty level to start practicing your Thai-English vocabulary.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
              {getLevels().map((level) => (
                <button
                  key={level}
                  onClick={() => startGame(level)}
                  className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="mb-4 w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    {/* Map levels to icons */}
                    {(level === 'A1' || level === 'A2') && <span>🌱</span>}
                    {(level === 'B1' || level === 'B2') && <span>🌿</span>}
                    {(level === 'C1' || level === 'C2') && <span>🌳</span>}
                    {!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level) && <span>📚</span>}
                  </div>
                  <span className="text-xl font-bold capitalize mb-1">{level}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Start Review</span>

                  {bestTimes[level] && (
                    <div className="absolute top-4 right-4 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                      {formatTime(bestTimes[level])}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Game Board" className="relative flex flex-col items-center justify-center min-h-[70vh]">

            <div className="mb-4 w-full max-w-2xl flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
              <span>Level: <strong className="text-gray-900 dark:text-white capitalize">{currentLevel}</strong></span>
              <span>Pairs Left: <strong className="text-gray-900 dark:text-white">{6 - matchedPairs}</strong></span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-2xl perspective-1000">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`
                    relative aspect-[4/5] cursor-pointer
                    ${card.isMatched ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}
                    ${card.isShaking ? 'animate-shake' : ''}
                    transition-all duration-500 ease-in-out
                    preserve-3d group
                  `}
                >
                  <div className={`
                    w-full h-full preserve-3d transition-transform duration-500 rounded-xl shadow-sm
                    ${card.isFlipped ? 'rotate-y-180' : ''}
                  `}>
                    {/* Back (Hidden state - minimalist design) */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                    </div>

                    {/* Front (Content - Revealed) */}
                    <div className={`
                      absolute inset-0 backface-hidden rotate-y-180
                      bg-white dark:bg-gray-800 rounded-xl
                      flex items-center justify-center p-4 text-center
                      border-2 ${(card.isMatched || card.isCorrect) ? 'border-emerald-500' : 'border-emerald-200 dark:border-emerald-800'}
                    `}>
                      <span className={`
                        ${card.lang === 'th' ? 'text-lg' : 'text-xl'} 
                        font-medium text-gray-800 dark:text-gray-100
                      `}>
                        {card.content}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Victory Modal */}
            {gameStatus === 'won' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/30 dark:bg-black/60 backdrop-blur-sm animate-fade-in"></div>
                <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in text-center border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-3xl">
                    🏆
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Excellent!</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    You completed the <strong>{currentLevel}</strong> level in <span className="text-gray-900 dark:text-white font-mono font-bold">{formatTime(timer)}</span>
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>Vocabulary Review</span>
                      <span className="text-[10px] font-normal lowercase bg-gray-200 dark:bg-gray-700 px-1.5 rounded">click to learn</span>
                    </h3>
                    <div className="space-y-2">
                      {playedWords.map((word, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playAudio(word.en)}
                              className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform flex-shrink-0"
                              title="Listen"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            </button>
                            <button
                              onClick={() => setSelectedWord(word.en)}
                              className="text-left font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline decoration-emerald-500/30 underline-offset-4 transition-all"
                            >
                              {word.en}
                            </button>
                          </div>
                          <span className="text-gray-600 dark:text-gray-300 text-right">{word.th}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => startGame(currentLevel)}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={resetGame}
                      className="py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Word Detail Modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}

      <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 FlashDash. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
