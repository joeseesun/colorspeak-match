export interface ColorDefinition {
  id: string;
  name: string;
  hex: string;
  textColor: string; // 'text-white' or 'text-black' for contrast
}

export interface Tile {
  id: string; // Unique ID for the tile instance
  colorId: string; // ID of the color (matches ColorDefinition.id)
  isMatched: boolean;
  isSelected: boolean;
}

export enum GameStatus {
  IDLE,
  PLAYING,
  WON,
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
