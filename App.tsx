
import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, GRID_SIZE_PAIRS } from './constants';
import { Tile as TileType, GameStatus } from './types';
import { Tile } from './components/Tile';
import { WinnerModal } from './components/WinnerModal';
import { playColorName, preloadColorsAudio, playSFX } from './services/geminiService';

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
  
  // Stats
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  // Initialize Game
  const startGame = useCallback(() => {
    playSFX('click');
    const shuffledColors = shuffleArray(COLORS).slice(0, GRID_SIZE_PAIRS);
    
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
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleTileClick = async (clickedTile: TileType) => {
    // Block interaction if processing or invalid tile
    if (
      isProcessing || 
      clickedTile.isMatched || 
      clickedTile.isSelected
    ) return;

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
      <header className="w-full max-w-3xl flex flex-col items-center justify-center mb-8 gap-6 relative z-10">
        <div className="text-center animate-bounce-gentle">
          <h1 className="text-5xl md:text-6xl font-black text-[#FF6B6B] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
              style={{ WebkitTextStroke: '2px white' }}>
            ColorSpeak
          </h1>
          <div className="bg-[#FFD93D] text-[#6d4c41] px-4 py-1 rounded-full inline-block mt-2 font-bold border-2 border-white shadow-sm rotate-[-2deg]">
            Find the pairs!
          </div>
        </div>

        {/* Scoreboard - Bubble Style */}
        <div className="flex gap-4 md:gap-8">
           <div className="bg-white border-4 border-[#4ECDC4] rounded-[2rem] px-6 py-2 min-w-[110px] text-center shadow-[0_4px_0_#2ab7ca]">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Score</div>
              <div className="text-3xl font-black text-[#4ECDC4]">{score}</div>
           </div>
           <div className="bg-white border-4 border-[#FF6B6B] rounded-[2rem] px-6 py-2 min-w-[110px] text-center shadow-[0_4px_0_#ee5253]">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Moves</div>
              <div className="text-3xl font-black text-[#FF6B6B]">{moves}</div>
           </div>
        </div>
      </header>

      {/* Game Grid */}
      <main className="w-full max-w-3xl relative z-10 mb-24">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          {tiles.map(tile => {
            const colorDef = COLORS.find(c => c.id === tile.colorId);
            if (!colorDef) return null;
            return (
              <Tile 
                key={tile.id} 
                tile={tile} 
                colorDef={colorDef} 
                onClick={handleTileClick}
              />
            );
          })}
        </div>
      </main>

      {/* Controls (Floating Action Button style) */}
      <div className="fixed bottom-6 z-20">
        <button
          onClick={startGame}
          className="
            group px-8 py-4 
            bg-[#FF6B6B] border-4 border-white 
            text-white font-black text-xl rounded-full 
            shadow-[0_8px_0_#d32f2f] 
            active:translate-y-[4px] active:shadow-[0_2px_0_#d32f2f]
            hover:bg-[#ff5252] hover:scale-105
            transition-all duration-150 flex items-center gap-3
          "
        >
          <span className="text-2xl">↻</span> RESTART
        </button>
      </div>

      {/* Win Modal */}
      {gameStatus === GameStatus.WON && (
        <WinnerModal onRestart={startGame} />
      )}
    </div>
  );
}
