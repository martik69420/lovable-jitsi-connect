
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pause, Play, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

interface SnakeGameProps {
  onGameEnd?: (score: number) => void;
}

const GRID_SIZE = 25;
const INITIAL_SNAKE = [{ x: 12, y: 12 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const INITIAL_FOOD = { x: 18, y: 18 };

// Sound effects
const playSound = (frequency: number, duration: number) => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }
};

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState<NodeJS.Timeout | null>(null);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      // Ensure snake is valid before processing
      if (!currentSnake || !Array.isArray(currentSnake) || currentSnake.length === 0) {
        return INITIAL_SNAKE;
      }
      
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Move head based on current direction
      switch (directionRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        // Play game over sound
        playSound(220, 0.5);
        const finalScore = (currentSnake.length - 1) * 10;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('snake-high-score', finalScore.toString());
        }
        onGameEnd?.(finalScore);
        return currentSnake;
      }

      // Check self collision
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        // Play game over sound
        playSound(220, 0.5);
        const finalScore = (currentSnake.length - 1) * 10;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('snake-high-score', finalScore.toString());
        }
        onGameEnd?.(finalScore);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        // Update combo and score with multiplier
        setCombo(prev => prev + 1);
        const multiplier = Math.min(5, 1 + Math.floor(combo / 3));
        const points = 10 * multiplier;
        setScore(prev => prev + points);
        setFood(generateFood(newSnake));
        
        // Play food eating sound with higher pitch for combo
        playSound(440 + (combo * 50), 0.15);
        
        // Reset combo timer
        if (comboTimer) clearTimeout(comboTimer);
        setComboTimer(setTimeout(() => setCombo(0), 3000));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, onGameEnd, highScore]);

  // Game loop with dynamic speed
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      const speed = Math.max(80, 160 - Math.floor(score / 50) * 8);
      gameLoopRef.current = setTimeout(moveSnake, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, gameOver, moveSnake, score]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;

      const key = e.key;
      const currentDirection = directionRef.current;

      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDirection !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDirection !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDirection !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDirection !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, gameOver]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure snake array is valid before rendering
    if (!snake || !Array.isArray(snake) || snake.length === 0) return;

    // Add roundRect polyfill if not available
    if (!ctx.roundRect) {
      ctx.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }

    const cellSize = canvas.width / GRID_SIZE;

    // Clear canvas with animated gradient background
    const time = Date.now() * 0.001;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${220 + Math.sin(time) * 10}, 100%, 4%)`);
    gradient.addColorStop(0.5, `hsl(${200 + Math.cos(time * 0.5) * 15}, 50%, 6%)`);
    gradient.addColorStop(1, `hsl(${240 + Math.sin(time * 0.3) * 20}, 80%, 8%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid with glow effect
    ctx.strokeStyle = `hsla(${220 + Math.sin(time * 2) * 30}, 60%, 40%, 0.1)`;
    ctx.lineWidth = 0.5;
    ctx.shadowColor = `hsl(${180 + Math.cos(time) * 20}, 100%, 50%)`;
    ctx.shadowBlur = 2;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;

    // Draw enhanced snake with glow and better styling
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      if (index === 0) {
        // Snake head with glow and animated eyes
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 15;
        
        const headGradient = ctx.createRadialGradient(
          x + cellSize/2, y + cellSize/2, 0,
          x + cellSize/2, y + cellSize/2, cellSize/2
        );
        headGradient.addColorStop(0, '#34d399');
        headGradient.addColorStop(0.7, '#22c55e');
        headGradient.addColorStop(1, '#16a34a');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Draw animated eyes based on direction
        const eyeTime = Date.now() * 0.01;
        const blinkFactor = Math.abs(Math.sin(eyeTime)) > 0.95 ? 0.3 : 1;
        
        ctx.fillStyle = '#ffffff';
        const eyeSize = cellSize * 0.12 * blinkFactor;
        
        // Position eyes based on direction
        let eye1X = x + cellSize * 0.3;
        let eye1Y = y + cellSize * 0.3;
        let eye2X = x + cellSize * 0.7;
        let eye2Y = y + cellSize * 0.3;
        
        if (direction === 'LEFT') {
          eye1X = x + cellSize * 0.2;
          eye2X = x + cellSize * 0.2;
          eye1Y = y + cellSize * 0.25;
          eye2Y = y + cellSize * 0.65;
        } else if (direction === 'RIGHT') {
          eye1X = x + cellSize * 0.8;
          eye2X = x + cellSize * 0.8;
          eye1Y = y + cellSize * 0.25;
          eye2Y = y + cellSize * 0.65;
        } else if (direction === 'UP') {
          eye1X = x + cellSize * 0.25;
          eye2X = x + cellSize * 0.65;
          eye1Y = y + cellSize * 0.2;
          eye2Y = y + cellSize * 0.2;
        }
        
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = '#000000';
        const pupilSize = eyeSize * 0.6;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, pupilSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Snake body with animated glow
        const intensity = Math.max(0.4, 1 - index * 0.08);
        ctx.shadowColor = `rgba(34, 197, 94, ${intensity * 0.5})`;
        ctx.shadowBlur = 8;
        
        const bodyGradient = ctx.createRadialGradient(
          x + cellSize/2, y + cellSize/2, 0,
          x + cellSize/2, y + cellSize/2, cellSize/2
        );
        bodyGradient.addColorStop(0, `rgba(52, 211, 153, ${intensity})`);
        bodyGradient.addColorStop(0.6, `rgba(34, 197, 94, ${intensity})`);
        bodyGradient.addColorStop(1, `rgba(22, 163, 74, ${intensity * 0.8})`);
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Add subtle pattern
        ctx.fillStyle = `rgba(16, 185, 129, ${intensity * 0.3})`;
        ctx.beginPath();
        ctx.roundRect(x + cellSize * 0.25, y + cellSize * 0.25, cellSize * 0.5, cellSize * 0.5, 1);
        ctx.fill();
      }
    });

    // Draw animated glowing food
    const foodX = food.x * cellSize;
    const foodY = food.y * cellSize;
    const pulseTime = Date.now() * 0.005;
    const pulse = Math.sin(pulseTime) * 0.1 + 0.9;
    
    // Outer glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20 * pulse;
    
    // Apple body with enhanced gradient
    const appleGradient = ctx.createRadialGradient(
      foodX + cellSize/2, foodY + cellSize/2, 0,
      foodX + cellSize/2, foodY + cellSize/2, cellSize/2
    );
    appleGradient.addColorStop(0, '#fde047');
    appleGradient.addColorStop(0.3, '#fbbf24');
    appleGradient.addColorStop(0.7, '#f59e0b');
    appleGradient.addColorStop(1, '#d97706');
    
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    const radius = (cellSize/2 - 2) * pulse;
    ctx.arc(foodX + cellSize/2, foodY + cellSize/2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Apple highlight with shimmer
    const shimmer = Math.sin(pulseTime * 2) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(253, 224, 71, ${shimmer})`;
    ctx.beginPath();
    ctx.arc(foodX + cellSize * 0.35, foodY + cellSize * 0.35, cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple stem
    ctx.fillStyle = '#065f46';
    ctx.fillRect(foodX + cellSize/2 - 1, foodY + cellSize * 0.15, 2, cellSize * 0.15);
    
    // Apple leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(foodX + cellSize * 0.6, foodY + cellSize * 0.2, cellSize * 0.08, cellSize * 0.04, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();

  }, [snake, food]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
    setIsPaused(false);
    setCombo(0);
    if (comboTimer) clearTimeout(comboTimer);
  };

  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
    setIsPaused(false);
    setCombo(0);
    if (comboTimer) clearTimeout(comboTimer);
  };

  // Cleanup combo timer on unmount
  useEffect(() => {
    return () => {
      if (comboTimer) clearTimeout(comboTimer);
    };
  }, [comboTimer]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-8 text-lg font-semibold">
        <div className="flex items-center gap-2">
          <span>Score: {score}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-600">
          <Trophy className="h-5 w-5" />
          <span>Best: {highScore}</span>
        </div>
        {combo > 0 && (
          <div className="flex items-center gap-2 text-orange-500 animate-pulse">
            <span>Combo: {combo}x</span>
          </div>
        )}
      </div>
      
      <Card className="p-4 bg-slate-900/90 border-slate-700 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="border border-slate-600 rounded-lg shadow-2xl"
        />
      </Card>

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
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-red-500">Game Over!</h3>
          <p className="text-muted-foreground">Final Score: {score}</p>
          {score === highScore && score > 0 && (
            <p className="text-yellow-500 font-semibold">🎉 New High Score! 🎉</p>
          )}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground space-y-1 bg-muted/20 p-4 rounded-lg">
        <p className="flex items-center justify-center gap-2">
          🎮 Use arrow keys or WASD to move
        </p>
        <p className="flex items-center justify-center gap-2">
          ⏸️ Press spacebar to pause
        </p>
        <p className="flex items-center justify-center gap-2">
          🍎 Eat the golden apples to grow and score points!
        </p>
        <p className="text-xs text-amber-500">
          ⚡ Game speeds up as you score more points!
        </p>
      </div>
    </div>
  );
};

export default SnakeGame;
