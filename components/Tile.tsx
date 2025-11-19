
import React from 'react';
import { Tile as TileType, ColorDefinition } from '../types';

interface TileProps {
  tile: TileType;
  colorDef: ColorDefinition;
  onClick: (tile: TileType) => void;
}

export const Tile: React.FC<TileProps> = ({ tile, colorDef, onClick }) => {
  const isRevealed = tile.isSelected || tile.isMatched;

  // Match logic: stay visible but slightly faded to show completion
  const matchedStyle = tile.isMatched ? "opacity-60 cursor-default" : "opacity-100 cursor-pointer active:scale-95";

  return (
    <div 
      className={`
        group perspective-1000 w-full aspect-square 
        transition-all duration-100 ease-out
        ${matchedStyle}
        /* Force hardware acceleration to prevent flicker */
        transform-gpu
      `} 
      onClick={() => onClick(tile)}
    >
      <div 
        className={`
          relative w-full h-full transform-style-3d transition-transform duration-300
          ${isRevealed ? 'rotate-y-180' : ''}
          ${!isRevealed && !tile.isMatched ? 'hover:scale-105' : ''}
        `}
      >
        {/* Card Back (Face Down) */}
        {/* Fix: Added explicit z-index management and opacity toggle hack for Safari */}
        <div 
          className={`
            absolute inset-0 w-full h-full backface-hidden 
            rounded-[2rem] shadow-[0_6px_0_#E0E0E0] overflow-hidden 
            border-4 border-white bg-white
            /* Hack: Hide back face immediately when flipped to prevent bleed-through */
            ${isRevealed ? 'invisible delay-150' : 'visible'}
          `}
          style={{ WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-[#4ECDC4] flex items-center justify-center relative overflow-hidden">
            {/* Cute Pattern */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,_#fff_3px,_transparent_3px)] bg-[length:16px_16px]"></div>
            
            {/* Big Question Mark */}
            <span className="text-5xl font-black text-white drop-shadow-md relative z-10 transform group-hover:rotate-12 transition-transform">?</span>
          </div>
        </div>

        {/* Card Front (Face Up / Color) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[2rem] shadow-[0_6px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-white relative"
          style={{ 
            backgroundColor: colorDef.hex,
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {/* Optimized Natural Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-[rgba(255,255,255,0.4)] to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute bottom-0 left-4 right-4 h-[20%] bg-gradient-to-t from-[rgba(0,0,0,0.1)] to-transparent rounded-b-[1.5rem] pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-2 bg-white opacity-40 rounded-full transform rotate-[-20deg] blur-[1px] pointer-events-none" />
          
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span 
              className={`
                font-black text-xl sm:text-2xl tracking-wide
                ${colorDef.textColor} drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] select-none
              `}
            >
              {colorDef.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
