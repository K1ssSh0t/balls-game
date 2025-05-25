import { FruitType } from '../types/game';

// Configuración de frutas - personaliza con tus imágenes
export const FRUITS: FruitType[] = [
  { id: 0, name: 'Mini', radius: 15, color: '#FF6B6B', points: 1, imagePath: '../assets/fruta1.png' },
  { id: 1, name: 'Pequeña', radius: 20, color: '#FF8E8E', points: 3, imagePath: '../assets/fruta2.png' },
  { id: 2, name: 'Mediana', radius: 25, color: '#9B59B6', points: 6, imagePath: '../assets/fruta3.png' },
  { id: 3, name: 'Grande', radius: 30, color: '#F39C12', points: 10, imagePath: '../assets/fruta4.png' },
];

export const GAME_CONFIG = {
  width: 800,
  height: 600,
  wallThickness: 20,
  dropLineY: 100,
  gravity: 0.8,
  restitution: 0.4,
  friction: 0.5
};

export const getRandomStartingFruit = (): FruitType => {
  // Solo permite las primeras 4 frutas como inicio
  return FRUITS[Math.floor(Math.random() * Math.min(4, FRUITS.length))];
};

export const getNextFruitId = (currentId: number): number | null => {
  return currentId < FRUITS.length - 1 ? currentId + 1 : null;
};