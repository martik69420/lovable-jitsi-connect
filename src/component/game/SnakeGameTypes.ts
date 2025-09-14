
export interface SnakeGameProps {
  onGameEnd: (score: number) => Promise<void>;
}

export type SnakeGameState = {
  score: number;
  isRunning: boolean;
  isPaused: boolean;
};
