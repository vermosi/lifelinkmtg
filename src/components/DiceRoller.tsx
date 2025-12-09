import { useState } from 'react';
import { cn } from '@/lib/utils';

type DieType = 4 | 6 | 8 | 10 | 12 | 20;

interface DiceRollerProps {
  onClose?: () => void;
}

export function DiceRoller({ onClose }: DiceRollerProps) {
  const [selectedDie, setSelectedDie] = useState<DieType>(20);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<{ die: DieType; result: number }[]>([]);

  const dice: DieType[] = [4, 6, 8, 10, 12, 20];

  const rollDie = (die: DieType) => {
    setSelectedDie(die);
    setIsRolling(true);
    
    // Animate through random numbers
    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * die) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * die) + 1;
        setResult(finalResult);
        setHistory(prev => [{ die, result: finalResult }, ...prev.slice(0, 9)]);
        setIsRolling(false);
      }
    }, 50);
  };

  const getDieShape = (die: DieType) => {
    switch (die) {
      case 4: return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      case 6: return 'none';
      case 8: return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 10: return 'polygon(50% 0%, 95% 35%, 80% 100%, 20% 100%, 5% 35%)';
      case 12: return 'polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)';
      case 20: return 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
    }
  };

  return (
    <div className="space-y-4">
      {/* Die selector */}
      <div className="grid grid-cols-6 gap-2">
        {dice.map((die) => (
          <button
            key={die}
            onClick={() => rollDie(die)}
            disabled={isRolling}
            className={cn(
              'aspect-square rounded-lg flex items-center justify-center font-display text-lg transition-all relative overflow-hidden',
              selectedDie === die && !isRolling
                ? 'bg-accent text-accent-foreground ring-2 ring-accent'
                : 'bg-secondary text-foreground hover:bg-secondary/80',
              isRolling && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className="absolute inset-1 opacity-20"
              style={{
                clipPath: getDieShape(die),
                backgroundColor: 'currentColor',
              }}
            />
            <span className="relative z-10">D{die}</span>
          </button>
        ))}
      </div>

      {/* Result display */}
      <div className="flex flex-col items-center py-6">
        <div
          className={cn(
            'w-24 h-24 rounded-2xl flex items-center justify-center transition-all',
            isRolling ? 'bg-accent/50 animate-pulse' : 'bg-accent'
          )}
        >
          <span className={cn(
            'font-display text-5xl text-accent-foreground transition-transform',
            isRolling && 'animate-bounce'
          )}>
            {result ?? '?'}
          </span>
        </div>
        {result && !isRolling && (
          <div className="mt-2 text-sm text-muted-foreground">
            D{selectedDie} → {result}
          </div>
        )}
      </div>

      {/* Quick roll buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => rollDie(20)}
          disabled={isRolling}
          className="px-4 py-2 bg-accent/20 text-accent rounded-lg font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          Roll D20
        </button>
        <button
          onClick={() => rollDie(6)}
          disabled={isRolling}
          className="px-4 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          Roll D6
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Recent Rolls</div>
          <div className="flex flex-wrap gap-1">
            {history.map((roll, idx) => (
              <div
                key={idx}
                className="px-2 py-1 bg-secondary/50 rounded text-xs font-mono"
              >
                D{roll.die}:{roll.result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
