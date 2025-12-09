import { useState, useEffect, useRef, useCallback } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { Skull, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FullScreenPlayerPanelProps {
  player: Player;
  allPlayers: Player[];
  onLifeChange: (delta: number) => void;
  onLifeSet: (life: number) => void;
  onPoisonChange: (delta: number) => void;
  onCommanderDamageChange: (fromPlayerId: number, delta: number) => void;
  isAdmin: boolean;
  rotation: number;
}

type OverlayMode = 'none' | 'poison' | 'commander';

export function FullScreenPlayerPanel({
  player,
  allPlayers,
  onLifeChange,
  onLifeSet,
  onPoisonChange,
  onCommanderDamageChange,
  isAdmin,
  rotation,
}: FullScreenPlayerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animating, setAnimating] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [commanderIndex, setCommanderIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef(false);

  const opponents = allPlayers.filter(p => p.id !== player.id);

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
    if (!isAdmin || overlayMode !== 'none') return;
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

  // Long press handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isAdmin) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;

    longPressTimer.current = setTimeout(() => {
      if (!isSwiping.current) {
        setOverlayMode('poison');
      }
    }, 500);
  }, [isAdmin]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
      isSwiping.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Swipe handling for commander damage navigation
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (overlayMode !== 'commander' || opponents.length <= 1) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setCommanderIndex(prev => (prev - 1 + opponents.length) % opponents.length);
      } else {
        setCommanderIndex(prev => (prev + 1) % opponents.length);
      }
    }
  }, [overlayMode, opponents.length]);

  const closeOverlay = () => {
    setOverlayMode('none');
    setCommanderIndex(0);
  };

  const switchToCommander = () => {
    setOverlayMode('commander');
    setCommanderIndex(0);
  };

  const currentOpponent = opponents[commanderIndex];
  const commanderDamage = currentOpponent ? (player.commanderDamage[currentOpponent.id] || 0) : 0;

  return (
    <div
      className="player-panel w-full h-full relative"
      style={{ backgroundColor: `hsl(${player.color})` }}
      onTouchStart={overlayMode === 'none' ? handleTouchStart : handleSwipeStart}
      onTouchMove={overlayMode === 'none' ? handleTouchMove : undefined}
      onTouchEnd={overlayMode === 'none' ? handleTouchEnd : handleSwipeEnd}
    >
      {/* Main life view */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-full transition-opacity",
          overlayMode !== 'none' && 'opacity-30'
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Minus button */}
        {isAdmin && overlayMode === 'none' && (
          <button
            onClick={() => handleLifeChange(-1)}
            className="life-button top-8"
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
            className="life-number text-[18vmin] w-[4ch] text-center bg-transparent outline-none"
          />
        ) : (
          <button
            onClick={handleLifeClick}
            disabled={!isAdmin || overlayMode !== 'none'}
            className={cn(
              'life-number text-[22vmin] leading-none transition-transform',
              animating && 'animate-pulse-scale',
              isAdmin && overlayMode === 'none' && 'cursor-pointer active:scale-95'
            )}
          >
            {player.life}
          </button>
        )}

        {/* Plus button */}
        {isAdmin && overlayMode === 'none' && (
          <button
            onClick={() => handleLifeChange(1)}
            className="life-button bottom-8"
          >
            +
          </button>
        )}

        {/* Poison indicator (always visible if > 0) */}
        {player.poison > 0 && overlayMode === 'none' && (
          <div 
            className="absolute bottom-16 left-4 flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Skull className="w-4 h-4 text-green-400" />
            <span className="font-display text-lg text-green-400">{player.poison}</span>
          </div>
        )}
      </div>

      {/* Poison Overlay */}
      {overlayMode === 'poison' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <button
            onClick={closeOverlay}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="text-center mb-4">
            <Skull className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <span className="font-display text-xl text-white/80 uppercase tracking-wider">Poison</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onPoisonChange(-1)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-light"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
            >
              −
            </button>
            <span className="font-display text-[15vmin] text-green-400 leading-none">
              {player.poison}
            </span>
            <button
              onClick={() => onPoisonChange(1)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-light"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
            >
              +
            </button>
          </div>

          <button
            onClick={switchToCommander}
            className="mt-8 px-6 py-3 rounded-xl font-medium"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
          >
            Commander Damage →
          </button>
        </div>
      )}

      {/* Commander Damage Overlay */}
      {overlayMode === 'commander' && currentOpponent && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <button
            onClick={closeOverlay}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="text-center mb-4">
            <span className="font-display text-xl text-white/80 uppercase tracking-wider">Commander Damage</span>
            <div className="text-sm text-white/60 mt-1">from {currentOpponent.name}</div>
          </div>

          <div className="flex items-center gap-4">
            {opponents.length > 1 && (
              <button
                onClick={() => setCommanderIndex(prev => (prev - 1 + opponents.length) % opponents.length)}
                className="p-2 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            <div 
              className="px-8 py-4 rounded-2xl flex flex-col items-center"
              style={{ backgroundColor: `hsl(${currentOpponent.color} / 0.8)` }}
            >
              <div className="flex items-center gap-6">
                <button
                  onClick={() => onCommanderDamageChange(currentOpponent.id, -1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-light"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  −
                </button>
                <span className="font-display text-[12vmin] leading-none" style={{ color: 'rgba(0,0,0,0.7)' }}>
                  {commanderDamage}
                </span>
                <button
                  onClick={() => onCommanderDamageChange(currentOpponent.id, 1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-light"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  +
                </button>
              </div>
            </div>

            {opponents.length > 1 && (
              <button
                onClick={() => setCommanderIndex(prev => (prev + 1) % opponents.length)}
                className="p-2 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Opponent indicators */}
          {opponents.length > 1 && (
            <div className="flex gap-2 mt-4">
              {opponents.map((opp, idx) => (
                <button
                  key={opp.id}
                  onClick={() => setCommanderIndex(idx)}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{ 
                    backgroundColor: idx === commanderIndex 
                      ? `hsl(${opp.color})` 
                      : 'rgba(255,255,255,0.3)',
                    transform: idx === commanderIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-6 text-white/50 text-sm">
            Swipe left/right to switch opponents
          </div>
        </div>
      )}

      {/* Commander damage indicators (always visible) */}
      {overlayMode === 'none' && Object.keys(player.commanderDamage).length > 0 && (
        <div 
          className="absolute bottom-16 right-4 flex gap-1"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {opponents.map(opp => {
            const dmg = player.commanderDamage[opp.id];
            if (!dmg) return null;
            return (
              <div
                key={opp.id}
                className="px-2 py-1 rounded-lg text-xs font-display"
                style={{ 
                  backgroundColor: `hsl(${opp.color} / 0.8)`,
                  color: 'rgba(0,0,0,0.7)',
                }}
              >
                {dmg}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
