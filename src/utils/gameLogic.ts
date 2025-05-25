import { type FruitType } from '../types/game';
import imgen1e1 from '../assets/images/fruit1.png';
import imgen2e1 from '../assets/images/fruit2.png';
import imgen3e1 from '../assets/images/fruit3.png';
import imgen4e1 from '../assets/images/fruit4.png';
import imgen5e1 from '../assets/images/fruit5.png';

// Configuración de frutas - personaliza con tus imágenes
export const FRUITS: FruitType[] = [
  { id: 0, name: 'Mini', radius: 10, color: '#FF6B6B', points: 1, imagePath: imgen1e1 },
  { id: 1, name: 'Pequeña', radius: 25, color: '#FF8E8E', points: 3, imagePath: imgen2e1 },
  { id: 2, name: 'Mediana', radius: 40, color: '#9B59B6', points: 6, imagePath: imgen3e1 },
  { id: 3, name: 'Grande', radius: 55, color: '#F39C12', points: 10, imagePath: imgen4e1 },
  { id: 4, name: 'Jumbo', radius: 70, color: '#F1C40F', points: 15, imagePath: imgen5e1 },
  // Agrega más frutas según necesites
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
  // Excluir la fruta más grande para el drop inicial
  const maxIndex = Math.min(3, FRUITS.length - 1);
  return FRUITS[Math.floor(Math.random() * maxIndex)];
};

// Esta función solo se usa para merges
export const getNextFruitId = (currentId: number): number | null => {
  return currentId < FRUITS.length - 1 ? currentId + 1 : null;
};

