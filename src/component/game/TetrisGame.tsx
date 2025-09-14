import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/component/ui/button';
import { Card } from '@/component/ui/card';
import { Pause, Play, RotateCcw, Trophy, ArrowDown, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';

type TetrisShape = number[][];
type Position = { x: number; y: number };

interface TetrisGameProps {
  onGameEnd?: (score: number) => void;
}

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 25;

// Tetris pieces (Tetrominoes)
const SHAPES: { [key: string]: TetrisShape[] } = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  ghost: 'rgba(255, 255, 255, 0.3)',
  filled: '#666'
};

interface Piece {
  shape: TetrisShape;
  position: Position;
  type: string;
  rotation: number;
}

const TetrisGame: React.FC<TetrisGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<string[][]>(() => 
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [dropTime, setDropTime] = useState<number>(1000);

  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tetris-high-score');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Create a random piece
  const createPiece = useCallback((): Piece => {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: SHAPES[type][0],
      position: { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 },
      type,
      rotation: 0
    };
  }, []);

  // Check if piece can be placed at position
  const canPlacePiece = useCallback((piece: Piece, testGrid: string[][]): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x;
          const newY = piece.position.y + y;
          
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return false;
          }
          if (newY >= 0 && testGrid[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const shapes = SHAPES[piece.type];
    const nextRotation = (piece.rotation + 1) % shapes.length;
    return {
      ...piece,
      shape: shapes[nextRotation],
      rotation: nextRotation
    };
  }, []);

  // Move piece
  const movePiece = useCallback((piece: Piece, dx: number, dy: number): Piece => {
    return {
      ...piece,
      position: { x: piece.position.x + dx, y: piece.position.y + dy }
    };
  }, []);

  // Clear completed lines
  const clearLines = useCallback((testGrid: string[][]): { grid: string[][], linesCleared: number } => {
    let linesCleared = 0;
    const newGrid = testGrid.filter((row, index) => {
      if (row.every(cell => cell !== '')) {
        linesCleared++;
        return false;
      }
      return true;
    });

    // Add empty rows at the top
    while (newGrid.length < GRID_HEIGHT) {
      newGrid.unshift(Array(GRID_WIDTH).fill(''));
    }

    return { grid: newGrid, linesCleared };
  }, []);

  // Place piece on grid
  const placePiece = useCallback((piece: Piece, testGrid: string[][]): string[][] => {
    const newGrid = testGrid.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x;
          const newY = piece.position.y + y;
          if (newY >= 0 && newY < GRID_HEIGHT && newX >= 0 && newX < GRID_WIDTH) {
            newGrid[newY][newX] = piece.type;
          }
        }
      }
    }
    
    return newGrid;
  }, []);

  // Game logic
  const dropPiece = useCallback(() => {
    if (!currentPiece) return;

    const movedPiece = movePiece(currentPiece, 0, 1);
    
    if (canPlacePiece(movedPiece, grid)) {
      setCurrentPiece(movedPiece);
    } else {
      // Place piece and create new one
      const newGrid = placePiece(currentPiece, grid);
      const { grid: clearedGrid, linesCleared } = clearLines(newGrid);
      
      setGrid(clearedGrid);
      setLines(prev => prev + linesCleared);
      
      // Update score
      const pointsPerLine = [0, 40, 100, 300, 1200];
      const points = pointsPerLine[linesCleared] * level;
      setScore(prev => prev + points);
      
      // Level up every 10 lines
      if (lines + linesCleared >= level * 10) {
        setLevel(prev => prev + 1);
        setDropTime(prev => Math.max(50, prev - 50));
      }
      
      // Check if next piece can be placed
      if (nextPiece && canPlacePiece(nextPiece, clearedGrid)) {
        setCurrentPiece(nextPiece);
        setNextPiece(createPiece());
      } else {
        // Game over
        setGameOver(true);
        setIsPlaying(false);
        
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('tetris-high-score', score.toString());
        }
        onGameEnd?.(score);
      }
    }
  }, [currentPiece, grid, nextPiece, createPiece, canPlacePiece, movePiece, placePiece, clearLines, lines, level, score, highScore, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setTimeout(dropPiece, dropTime);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, gameOver, dropPiece, dropTime]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver || !currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          {
            const movedPiece = movePiece(currentPiece, -1, 0);
            if (canPlacePiece(movedPiece, grid)) {
              setCurrentPiece(movedPiece);
            }
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          {
            const movedPiece = movePiece(currentPiece, 1, 0);
            if (canPlacePiece(movedPiece, grid)) {
              setCurrentPiece(movedPiece);
            }
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dropPiece();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          {
            const rotatedPiece = rotatePiece(currentPiece);
            if (canPlacePiece(rotatedPiece, grid)) {
              setCurrentPiece(rotatedPiece);
            }
          }
          break;
        case ' ':
          e.preventDefault();
          // Hard drop
          let hardDropPiece = currentPiece;
          while (canPlacePiece(movePiece(hardDropPiece, 0, 1), grid)) {
            hardDropPiece = movePiece(hardDropPiece, 0, 1);
          }
          setCurrentPiece(hardDropPiece);
          setTimeout(dropPiece, 50);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, gameOver, currentPiece, grid, movePiece, canPlacePiece, rotatePiece, dropPiece]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw placed pieces
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y][x]) {
          // Add glow effect to placed pieces
          ctx.shadowColor = COLORS[grid[y][x] as keyof typeof COLORS] || COLORS.filled;
          ctx.shadowBlur = 8;
          
          ctx.fillStyle = COLORS[grid[y][x] as keyof typeof COLORS] || COLORS.filled;
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          
          ctx.shadowBlur = 0;
          
          // Add animated highlight
          const time = Date.now() * 0.003;
          const shimmer = Math.sin(time + x + y) * 0.1 + 0.2;
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, 4);
        }
      }
    }

    // Draw ghost piece
    if (currentPiece) {
      let ghostPiece = currentPiece;
      while (canPlacePiece(movePiece(ghostPiece, 0, 1), grid)) {
        ghostPiece = movePiece(ghostPiece, 0, 1);
      }
      
      ctx.fillStyle = COLORS.ghost;
      for (let y = 0; y < ghostPiece.shape.length; y++) {
        for (let x = 0; x < ghostPiece.shape[y].length; x++) {
          if (ghostPiece.shape[y][x]) {
            const drawX = ghostPiece.position.x + x;
            const drawY = ghostPiece.position.y + y;
            if (drawY >= 0) {
              ctx.fillRect(drawX * CELL_SIZE + 1, drawY * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            }
          }
        }
      }
    }

    // Draw current piece with enhanced animations
    if (currentPiece) {
      const time = Date.now() * 0.005;
      const pulse = Math.sin(time) * 0.05 + 0.95;
      
      // Add strong glow to current piece
      ctx.shadowColor = COLORS[currentPiece.type as keyof typeof COLORS];
      ctx.shadowBlur = 15 * pulse;
      
      ctx.fillStyle = COLORS[currentPiece.type as keyof typeof COLORS];
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const drawX = currentPiece.position.x + x;
            const drawY = currentPiece.position.y + y;
            if (drawY >= 0) {
              // Scale with pulse
              const size = (CELL_SIZE - 2) * pulse;
              const offset = (CELL_SIZE - size) / 2;
              ctx.fillRect(drawX * CELL_SIZE + 1 + offset, drawY * CELL_SIZE + 1 + offset, size, size);
              
              ctx.shadowBlur = 0;
              
              // Add animated highlight
              const shimmer = Math.sin(time * 2 + x + y) * 0.2 + 0.3;
              ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
              ctx.fillRect(drawX * CELL_SIZE + 1, drawY * CELL_SIZE + 1, CELL_SIZE - 2, 4);
              ctx.fillStyle = COLORS[currentPiece.type as keyof typeof COLORS];
            }
          }
        }
      }
      ctx.shadowBlur = 0;
    }
  }, [grid, currentPiece, canPlacePiece, movePiece]);

  const startGame = () => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''));
    setGrid(newGrid);
    setCurrentPiece(createPiece());
    setNextPiece(createPiece());
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(1000);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const resetGame = () => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''));
    setGrid(newGrid);
    setCurrentPiece(null);
    setNextPiece(null);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(1000);
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-8 text-lg font-semibold">
        <div className="animate-pulse">Score: {score}</div>
        <div className="animate-fade-in">Level: {level}</div>
        <div className="animate-scale-in">Lines: {lines}</div>
        <div className="flex items-center gap-2 text-yellow-600 animate-pulse">
          <Trophy className="h-5 w-5" />
          <span>Best: {highScore}</span>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Card className="p-4 bg-slate-900/90 border-slate-700">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            className="border border-slate-600 rounded-lg"
          />
        </Card>
        
        <div className="space-y-4">
          <Card className="p-3 bg-slate-900/90 border-slate-700">
            <h3 className="text-sm font-semibold mb-2 text-white">Next</h3>
            <div className="w-16 h-16 bg-slate-800 rounded border flex items-center justify-center">
              {nextPiece && (
                <div className="grid grid-cols-4 gap-0.5">
                  {Array.from({ length: 4 }, (_, y) => 
                    Array.from({ length: 4 }, (_, x) => (
                      <div
                        key={`${x}-${y}`}
                        className="w-2 h-2"
                        style={{
                          backgroundColor: 
                            nextPiece.shape[y] && nextPiece.shape[y][x]
                              ? COLORS[nextPiece.type as keyof typeof COLORS]
                              : 'transparent'
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-3 bg-slate-900/90 border-slate-700">
            <h3 className="text-sm font-semibold mb-2 text-white">Controls</h3>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3 h-3" />
                <ArrowRight className="w-3 h-3" />
                <span>Move</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="w-3 h-3" />
                <span>Soft Drop</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCw className="w-3 h-3" />
                <span>Rotate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Space</span>
                <span>Hard Drop</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        {!isPlaying ? (
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
        ) : (
          <Button onClick={togglePause} variant="outline" className="flex items-center gap-2">
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
        
        <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {gameOver && (
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">Game Over!</p>
          <p className="text-lg">Final Score: {score}</p>
        </div>
      )}
    </div>
  );
};

export default TetrisGame;