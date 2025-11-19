
import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, DIFFICULTY_CONFIG } from './constants';
import { Tile as TileType, GameStatus, DifficultyLevel } from './types';
import { Tile } from './components/Tile';
import { WinnerModal } from './components/WinnerModal';
import { playColorName, preloadColorsAudio, playSFX, resumeAudioContext } from './services/geminiService';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function App() {
  const [tiles, setTiles] = useState<TileType[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // New State: Difficulty (Default to Easy)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  
  // New State: Has User Interacted? (For Audio Context)
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Stats
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  // Initialize Game
  const startGame = useCallback(() => {
    // Only play click sound if game has started/user interacted to avoid autoplay blocks
    if (hasInteracted) {
        playSFX('click');
    }
    
    const config = DIFFICULTY_CONFIG[difficulty];
    // Slice colors based on difficulty pairs
    const shuffledColors = shuffleArray(COLORS).slice(0, config.pairs);
    
    // Preload audio
    const colorNamesToPreload = shuffledColors.map(c => c.name);
    preloadColorsAudio(colorNamesToPreload);

    // Create pairs
    let gameTiles: TileType[] = [];
    shuffledColors.forEach((color) => {
      gameTiles.push({
        id: `${color.id}-1`,
        colorId: color.id,
        isMatched: false,
        isSelected: false,
      });
      gameTiles.push({
        id: `${color.id}-2`,
        colorId: color.id,
        isMatched: false,
        isSelected: false,
      });
    });

    setTiles(shuffleArray(gameTiles));
    setGameStatus(GameStatus.PLAYING);
    setSelectedTileId(null);
    setScore(0);
    setMoves(0);
    setIsProcessing(false);
  }, [difficulty, hasInteracted]); // Added hasInteracted to dependency array

  // Restart when difficulty changes
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Unlock AudioContext on first user interaction anywhere
  useEffect(() => {
    const unlockAudio = () => {
      resumeAudioContext();
      setHasInteracted(true);
      // Remove listeners once unlocked
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const handleTileClick = async (clickedTile: TileType) => {
    // Block interaction if processing or invalid tile
    if (
      isProcessing || 
      clickedTile.isMatched || 
      clickedTile.isSelected
    ) return;

    // Force resume audio context on every click just in case
    await resumeAudioContext();

    // 1. IMMEDIATE VISUAL FEEDBACK
    // Update state first to ensure React reacts instantly
    if (!selectedTileId) {
      // First tile logic
      setTiles(prev => prev.map(t => 
        t.id === clickedTile.id ? { ...t, isSelected: true } : t
      ));
      setSelectedTileId(clickedTile.id);
      playSFX('click'); // Play sound *after* state trigger
      return;
    }

    // Second tile logic
    setIsProcessing(true);
    setMoves(m => m + 1);
    
    // Reveal second tile
    setTiles(prev => prev.map(t => 
      t.id === clickedTile.id ? { ...t, isSelected: true } : t
    ));
    playSFX('click');

    // 2. LOGIC (After visual update)
    const firstTile = tiles.find(t => t.id === selectedTileId);
    if (!firstTile) {
      setIsProcessing(false);
      return;
    }

    const isMatch = firstTile.colorId === clickedTile.colorId;

    // Delay logic slightly to let the user see the second card
    if (isMatch) {
      // --- MATCH ---
      setTimeout(() => {
        playSFX('match');
        const colorDef = COLORS.find(c => c.id === firstTile.colorId);
        if (colorDef) {
          playColorName(colorDef.name);
        }
        setScore(s => s + 100);

        // Wait a bit more to clear the tiles
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === firstTile.id || t.id === clickedTile.id
              ? { ...t, isMatched: true, isSelected: false }
              : t
          ));
          setSelectedTileId(null);
          setIsProcessing(false);
        }, 600);
      }, 300); // Wait 300ms for flip animation to finish before playing match sound

    } else {
      // --- MISMATCH ---
      setTimeout(() => {
        playSFX('mismatch');
        setScore(s => Math.max(0, s - 10));

        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === firstTile.id || t.id === clickedTile.id
              ? { ...t, isSelected: false }
              : t
          ));
          setSelectedTileId(null);
          setIsProcessing(false);
        }, 800);
      }, 400); // Wait slightly longer for mismatch realization
    }
  };

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING && tiles.length > 0) {
      const allMatched = tiles.every(t => t.isMatched);
      if (allMatched) {
        setTimeout(() => {
          setGameStatus(GameStatus.WON);
          playSFX('win');
        }, 500);
      }
    }
  }, [tiles, gameStatus]);

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 relative overflow-x-hidden">
      
      {/* Cartoon Clouds Decoration */}
      <div className="absolute top-10 left-[-50px] w-32 h-20 bg-white rounded-full opacity-80 animate-bounce-gentle"></div>
      <div className="absolute top-20 right-[-20px] w-40 h-24 bg-white rounded-full opacity-60 animate-bounce-gentle" style={{animationDelay: '1s'}}></div>

      {/* Header & Stats */}
      <header className="w-full max-w-3xl flex flex-col items-center justify-center mb-6 gap-4 relative z-10">
        <div className="text-center animate-bounce-gentle">
          <h1 className="text-4xl md:text-6xl font-black text-[#FF6B6B] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
              style={{ WebkitTextStroke: '2px white' }}>
            ColorSpeak
          </h1>
          
          {/* Difficulty Switcher */}
          <div className="flex bg-white/50 p-1 rounded-full backdrop-blur-sm mt-2 shadow-sm border-2 border-white">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`
                  px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                  ${difficulty === level 
                    ? 'bg-[#FFD93D] text-[#6d4c41] shadow-sm scale-105' 
                    : 'text-gray-500 hover:bg-white/50'}
                `}
              >
                {DIFFICULTY_CONFIG[level].label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Row: Score - Restart - Moves */}
        <div className="flex items-center justify-center gap-3 md:gap-6 w-full flex-wrap">
           {/* Score */}
           <div className="bg-white border-4 border-[#4ECDC4] rounded-[1.5rem] px-4 py-1 md:px-6 md:py-2 min-w-[90px] md:min-w-[110px] text-center shadow-[0_4px_0_#2ab7ca]">
              <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Score</div>
              <div className="text-2xl md:text-3xl font-black text-[#4ECDC4]">{score}</div>
           </div>

           {/* Restart Button */}
           <button
              onClick={startGame}
              className="
                group px-4 py-2 md:px-6 md:py-3
                bg-[#FF6B6B] border-4 border-white 
                text-white font-black text-lg md:text-xl rounded-full 
                shadow-[0_4px_0_#d32f2f] 
                active:translate-y-[2px] active:shadow-[0_2px_0_#d32f2f]
                hover:bg-[#ff5252] hover:scale-105
                transition-all duration-150 flex items-center gap-2
              "
              title="Restart Game"
            >
              <span className="text-xl md:text-2xl">↻</span>
            </button>

           {/* Moves */}
           <div className="bg-white border-4 border-[#FF6B6B] rounded-[1.5rem] px-4 py-1 md:px-6 md:py-2 min-w-[90px] md:min-w-[110px] text-center shadow-[0_4px_0_#ee5253]">
              <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Moves</div>
              <div className="text-2xl md:text-3xl font-black text-[#FF6B6B]">{moves}</div>
           </div>
        </div>
      </header>

      {/* Game Grid */}
      <main className="w-full max-w-3xl relative z-10 mb-8 flex justify-center">
        <div className={`
          grid gap-2 sm:gap-3 md:gap-4 px-2 transition-all duration-300
          ${difficulty === 'easy' ? 'w-auto' : 'w-full'}
          ${DIFFICULTY_CONFIG[difficulty].colsBase} 
          md:${DIFFICULTY_CONFIG[difficulty].colsMd}
        `}>
          {tiles.map(tile => {
            const colorDef = COLORS.find(c => c.id === tile.colorId);
            if (!colorDef) return null;
            return (
              <div key={tile.id} className={difficulty === 'easy' ? 'w-32 md:w-40' : 'w-full'}>
                <Tile 
                  tile={tile} 
                  colorDef={colorDef} 
                  onClick={handleTileClick}
                />
              </div>
            );
          })}
        </div>
      </main>

      {/* Win Modal */}
      {gameStatus === GameStatus.WON && (
        <WinnerModal onRestart={startGame} />
      )}
    </div>
  );
}
