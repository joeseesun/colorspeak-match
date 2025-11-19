import { ColorDefinition } from './types';

export const COLORS: ColorDefinition[] = [
  { id: 'red', name: 'Red', hex: '#EF4444', textColor: 'text-white' },
  { id: 'orange', name: 'Orange', hex: '#F97316', textColor: 'text-white' },
  { id: 'yellow', name: 'Yellow', hex: '#EAB308', textColor: 'text-black' }, // Contrast fix
  { id: 'green', name: 'Green', hex: '#22C55E', textColor: 'text-white' },
  { id: 'cyan', name: 'Cyan', hex: '#06B6D4', textColor: 'text-white' },
  { id: 'blue', name: 'Blue', hex: '#3B82F6', textColor: 'text-white' },
  { id: 'purple', name: 'Purple', hex: '#A855F7', textColor: 'text-white' },
  { id: 'pink', name: 'Pink', hex: '#EC4899', textColor: 'text-white' },
  { id: 'brown', name: 'Brown', hex: '#78350F', textColor: 'text-white' },
  { id: 'black', name: 'Black', hex: '#171717', textColor: 'text-white' }, // Soft black
  { id: 'white', name: 'White', hex: '#FFFFFF', textColor: 'text-black' },
  { id: 'gray', name: 'Gray', hex: '#6B7280', textColor: 'text-white' },
];

// 12 pairs = 24 tiles (4x6 grid), perfect for mobile/tablet
export const GRID_SIZE_PAIRS = 12;