import { useState, useEffect } from 'react';
import { Player } from '@/lib/roomUtils';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  player: Player;
  onLifeChange: (delta: number) => void;
  onNameChange: (name: string) => void;
  onLifeSet: (life: number) => void;
  isAdmin: boolean;
  compact?: boolean;
}

export function PlayerPanel({
  player,
  onLifeChange,
  onNameChange,
  onLifeSet,
  isAdmin,
  compact = false,
}: PlayerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animationClass, setAnimationClass] = useState('');
  const [prevLife, setPrevLife] = useState(player.life);

  useEffect(() => {
    if (player.life !== prevLife) {
      setAnimationClass(player.life > prevLife ? 'animate-flash-green' : 'animate-flash-red');
      setPrevLife(player.life);
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [player.life, prevLife]);

  const handleLifeClick = () => {
    if (!isAdmin) return;
    setEditValue(player.life.toString());
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    const newLife = parseInt(editValue, 10);
    if (!isNaN(newLife)) {
      onLifeSet(newLife);
    }
    setIsEditing(false);
  };

  const playerColorStyle = {
    '--player-color': player.color,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all',
        compact ? 'p-4 gap-2' : 'p-6 gap-4',
        animationClass
      )}
      style={playerColorStyle}
    >
      {/* Player name */}
      {isAdmin ? (
        <input
          type="text"
          value={player.name}
          onChange={(e) => onNameChange(e.target.value)}
          className={cn(
            'bg-transparent text-center font-medium text-muted-foreground focus:text-foreground focus:outline-none border-b border-transparent focus:border-primary/50 transition-colors',
            compact ? 'text-sm' : 'text-lg'
          )}
        />
      ) : (
        <span className={cn('text-muted-foreground font-medium', compact ? 'text-sm' : 'text-lg')}>
          {player.name}
        </span>
      )}

      {/* Life total section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Minus buttons */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onLifeChange(-1)}
              className={cn('btn-life', compact ? 'w-10 h-10 text-lg' : 'w-12 h-12 text-xl')}
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => onLifeChange(-5)}
              className={cn('btn-life text-destructive', compact ? 'w-10 h-8 text-xs' : 'w-12 h-10 text-sm')}
            >
              -5
            </button>
          </div>
        )}

        {/* Life total display */}
        <div className="relative">
          {isEditing ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              autoFocus
              className={cn(
                'font-display font-bold text-center bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                compact ? 'w-20 text-4xl p-2' : 'w-32 text-6xl p-3'
              )}
              style={{ color: `hsl(${player.color})` }}
            />
          ) : (
            <button
              onClick={handleLifeClick}
              disabled={!isAdmin}
              className={cn(
                'font-display font-bold transition-transform',
                isAdmin && 'hover:scale-105 cursor-pointer',
                compact ? 'text-5xl' : 'text-7xl sm:text-8xl'
              )}
              style={{
                color: `hsl(${player.color})`,
                textShadow: `0 0 20px hsl(${player.color} / 0.5), 0 0 40px hsl(${player.color} / 0.3)`,
              }}
            >
              {player.life}
            </button>
          )}
        </div>

        {/* Plus buttons */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onLifeChange(1)}
              className={cn('btn-life btn-life-primary', compact ? 'w-10 h-10 text-lg' : 'w-12 h-12 text-xl')}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => onLifeChange(5)}
              className={cn('btn-life btn-life-primary', compact ? 'w-10 h-8 text-xs' : 'w-12 h-10 text-sm')}
            >
              +5
            </button>
          </div>
        )}
      </div>

      {/* Decorative player indicator */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full"
        style={{ backgroundColor: `hsl(${player.color})` }}
      />
    </div>
  );
}
