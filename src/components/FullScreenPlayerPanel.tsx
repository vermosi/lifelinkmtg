import { useState, useEffect, useRef } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';

interface FullScreenPlayerPanelProps {
  player: Player;
  onLifeChange: (delta: number) => void;
  onLifeSet: (life: number) => void;
  isAdmin: boolean;
  rotation: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom' | 'center';
}

export function FullScreenPlayerPanel({
  player,
  onLifeChange,
  onLifeSet,
  isAdmin,
  rotation,
  position,
}: FullScreenPlayerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animating, setAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLifeChange = (delta: number) => {
    if (!isAdmin) return;
    onLifeChange(delta);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
  };

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

  const getButtonPositions = () => {
    // Position +/- buttons based on rotation
    if (rotation === 180 || rotation === 0) {
      return {
        minus: 'top-8',
        plus: 'bottom-8',
      };
    }
    return {
      minus: 'top-8',
      plus: 'bottom-8',
    };
  };

  const buttonPos = getButtonPositions();

  return (
    <div
      className="player-panel w-full h-full"
      style={{ backgroundColor: `hsl(${player.color})` }}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full h-full"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Minus button */}
        {isAdmin && (
          <button
            onClick={() => handleLifeChange(-1)}
            className={cn('life-button', buttonPos.minus)}
          >
            −
          </button>
        )}

        {/* Life total */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
            className="life-number text-[20vmin] w-[4ch] text-center bg-transparent outline-none"
            style={{ transform: `rotate(0deg)` }}
          />
        ) : (
          <button
            onClick={handleLifeClick}
            disabled={!isAdmin}
            className={cn(
              'life-number text-[22vmin] leading-none transition-transform',
              animating && 'animate-pulse-scale',
              isAdmin && 'cursor-pointer active:scale-95'
            )}
          >
            {player.life}
          </button>
        )}

        {/* Plus button */}
        {isAdmin && (
          <button
            onClick={() => handleLifeChange(1)}
            className={cn('life-button', buttonPos.plus)}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
