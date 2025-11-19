
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
  const matchedStyle = tile.isMatched ? "opacity-60 cursor-default" : "opacity-100 cursor-pointer active:scale-90";

  return (
    <div 
      className={`
        group perspective-1000 w-full aspect-square 
        transition-all duration-100 ease-out
        ${matchedStyle}
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
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-[2rem] shadow-[0_6px_0_#E0E0E0] overflow-hidden border-4 border-white bg-white">
          <div className="w-full h-full bg-[#4ECDC4] flex items-center justify-center relative overflow-hidden">
            {/* Cute Pattern */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,_#fff_3px,_transparent_3px)] bg-[length:16px_16px]"></div>
            
            {/* Big Question Mark */}
            <span className="text-5xl font-black text-white drop-shadow-md relative z-10 transform group-hover:rotate-12 transition-transform">?</span>
          </div>
        </div>

        {/* Card Front (Face Up / Color) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[2rem] shadow-[0_6px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-white"
          style={{ backgroundColor: colorDef.hex }}
        >
          {/* Glossy Reflection */}
          <div className="absolute top-3 left-3 right-3 h-1/3 bg-white opacity-30 rounded-t-2xl pointer-events-none" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={`
                font-black text-xl sm:text-2xl tracking-wide
                ${colorDef.textColor} drop-shadow-md select-none
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
