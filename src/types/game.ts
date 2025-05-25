export interface FruitType {
  id: number;
  name: string;
  radius: number;
  color: string;
  points: number;
  imagePath: string; // Ruta a tu imagen personalizada
}

export interface GameState {
  score: number;
  gameOver: boolean;
  nextFruit: FruitType;
  level: number;
}