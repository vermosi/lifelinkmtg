import { useState, useEffect, useRef, useCallback } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { Skull, ChevronLeft, ChevronRight, X, Crown, Zap, Sparkles } from 'lucide-react';

interface FullScreenPlayerPanelProps {
  player: Player;
  allPlayers: Player[];
  isMonarch: boolean;
  onLifeChange: (delta: number) => void;
  onLifeSet: (life: number) => void;
  onPoisonChange: (delta: number) => void;
  onExperienceChange: (delta: number) => void;
  onEnergyChange: (delta: number) => void;
  onCommanderDamageChange: (fromPlayerId: number, delta: number) => void;
  onToggleMonarch: () => void;
  isAdmin: boolean;
  rotation: number;
}

type OverlayMode = 'none' | 'counters' | 'commander';
type CounterTab = 'poison' | 'experience' | 'energy';

export function FullScreenPlayerPanel({
  player,
  allPlayers,
  isMonarch,
  onLifeChange,
  onLifeSet,
  onPoisonChange,
  onExperienceChange,
  onEnergyChange,
  onCommanderDamageChange,
  onToggleMonarch,
  isAdmin,
  rotation,
}: FullScreenPlayerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animating, setAnimating] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [counterTab, setCounterTab] = useState<CounterTab>('poison');
  const [commanderIndex, setCommanderIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
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

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Touch handling for long press
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isAdmin) return;
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;

    longPressTimer.current = setTimeout(() => {
      if (!isSwiping.current) {
        setOverlayMode('counters');
      }
    }, 500);
  }, [isAdmin]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (deltaX > 30) {
      isSwiping.current = true;
      clearLongPress();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
  }, []);

  // Mouse handling for PC users
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    setOverlayMode('counters');
  }, [isAdmin]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAdmin || e.button !== 0) return;
    longPressTimer.current = setTimeout(() => {
      setOverlayMode('counters');
    }, 500);
  }, [isAdmin]);

  const handleMouseUp = useCallback(() => {
    clearLongPress();
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearLongPress();
  }, []);

  // Swipe handling
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

  const getCounterValue = () => {
    switch (counterTab) {
      case 'poison': return player.poison;
      case 'experience': return player.experience;
      case 'energy': return player.energy;
    }
  };

  const handleCounterChange = (delta: number) => {
    switch (counterTab) {
      case 'poison': onPoisonChange(delta); break;
      case 'experience': onExperienceChange(delta); break;
      case 'energy': onEnergyChange(delta); break;
    }
  };

  const currentOpponent = opponents[commanderIndex];
  const commanderDamage = currentOpponent ? (player.commanderDamage[currentOpponent.id] || 0) : 0;

  const CounterIcon = counterTab === 'poison' ? Skull : counterTab === 'experience' ? Sparkles : Zap;
  const counterColor = counterTab === 'poison' ? 'text-green-400' : counterTab === 'experience' ? 'text-yellow-400' : 'text-blue-400';

  return (
    <div
      className="player-panel w-full h-full relative"
      style={{ backgroundColor: `hsl(${player.color})` }}
      onTouchStart={overlayMode === 'none' ? handleTouchStart : handleSwipeStart}
      onTouchMove={overlayMode === 'none' ? handleTouchMove : undefined}
      onTouchEnd={overlayMode === 'none' ? handleTouchEnd : handleSwipeEnd}
      onContextMenu={overlayMode === 'none' ? handleContextMenu : undefined}
      onMouseDown={overlayMode === 'none' ? handleMouseDown : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Monarch crown */}
      {isMonarch && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg" fill="currentColor" />
        </div>
      )}

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

        {/* Counter indicators (bottom left) */}
        {overlayMode === 'none' && (
          <div className="absolute bottom-16 left-4 flex flex-col gap-1">
            {player.poison > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <Skull className="w-4 h-4 text-green-400" />
                <span className="font-display text-sm text-green-400">{player.poison}</span>
              </div>
            )}
            {player.experience > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="font-display text-sm text-yellow-400">{player.experience}</span>
              </div>
            )}
            {player.energy > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="font-display text-sm text-blue-400">{player.energy}</span>
              </div>
            )}
          </div>
        )}

        {/* Commander damage indicators (bottom right) */}
        {overlayMode === 'none' && Object.keys(player.commanderDamage).length > 0 && (
          <div className="absolute bottom-16 right-4 flex gap-1">
            {opponents.map(opp => {
              const dmg = player.commanderDamage[opp.id];
              if (!dmg) return null;
              return (
                <div
                  key={opp.id}
                  className="px-2 py-1 rounded-lg text-xs font-display"
                  style={{ backgroundColor: `hsl(${opp.color} / 0.8)`, color: 'rgba(0,0,0,0.7)' }}
                >
                  {dmg}
                </div>
              );
            })}
          </div>
        )}

        {/* Hint text for PC users */}
        {isAdmin && overlayMode === 'none' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs opacity-30" style={{ color: 'rgba(0,0,0,0.5)' }}>
            Right-click for counters
          </div>
        )}
      </div>

      {/* Counters Overlay */}
      {overlayMode === 'counters' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <button
            onClick={closeOverlay}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Tab selector */}
          <div className="flex gap-2 mb-6">
            {(['poison', 'experience', 'energy'] as const).map(tab => {
              const Icon = tab === 'poison' ? Skull : tab === 'experience' ? Sparkles : Zap;
              const color = tab === 'poison' ? 'text-green-400' : tab === 'experience' ? 'text-yellow-400' : 'text-blue-400';
              const bgColor = tab === 'poison' ? 'bg-green-400/20' : tab === 'experience' ? 'bg-yellow-400/20' : 'bg-blue-400/20';
              return (
                <button
                  key={tab}
                  onClick={() => setCounterTab(tab)}
                  className={cn(
                    'px-4 py-2 rounded-xl flex items-center gap-2 transition-all',
                    counterTab === tab ? bgColor : 'bg-black/20'
                  )}
                >
                  <Icon className={cn('w-5 h-5', counterTab === tab ? color : 'text-white/50')} />
                  <span className={cn('font-medium capitalize', counterTab === tab ? color : 'text-white/50')}>
                    {tab}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Counter value */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleCounterChange(-1)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-light"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
            >
              −
            </button>
            <div className="flex flex-col items-center">
              <CounterIcon className={cn('w-8 h-8 mb-2', counterColor)} />
              <span className={cn('font-display text-[12vmin] leading-none', counterColor)}>
                {getCounterValue()}
              </span>
            </div>
            <button
              onClick={() => handleCounterChange(1)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-light"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
            >
              +
            </button>
          </div>

          {/* Bottom actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onToggleMonarch}
              className={cn(
                'px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all',
                isMonarch ? 'bg-yellow-400/30 text-yellow-400' : 'bg-black/30 text-white'
              )}
            >
              <Crown className="w-5 h-5" fill={isMonarch ? 'currentColor' : 'none'} />
              {isMonarch ? 'Monarch' : 'Make Monarch'}
            </button>
            <button
              onClick={switchToCommander}
              className="px-5 py-3 rounded-xl font-medium bg-black/30 text-white"
            >
              Commander Dmg →
            </button>
          </div>
        </div>
      )}

      {/* Commander Damage Overlay */}
      {overlayMode === 'commander' && currentOpponent && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4"
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
                <span className="font-display text-[10vmin] leading-none" style={{ color: 'rgba(0,0,0,0.7)' }}>
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

          {opponents.length > 1 && (
            <div className="flex gap-2 mt-4">
              {opponents.map((opp, idx) => (
                <button
                  key={opp.id}
                  onClick={() => setCommanderIndex(idx)}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{ 
                    backgroundColor: idx === commanderIndex ? `hsl(${opp.color})` : 'rgba(255,255,255,0.3)',
                    transform: idx === commanderIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setOverlayMode('counters')}
            className="mt-6 px-4 py-2 rounded-lg text-white/60 text-sm"
          >
            ← Back to Counters
          </button>
        </div>
      )}
    </div>
  );
}
