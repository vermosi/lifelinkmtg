import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, DUNGEON_ROOMS } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Skull, ChevronLeft, ChevronRight, X, Crown, Zap, Sparkles, Shield, Swords } from 'lucide-react';

interface FullScreenPlayerPanelProps {
  player: Player;
  allPlayers: Player[];
  playerCount: number;
  isMonarch: boolean;
  hasInitiative: boolean;
  dungeonProgress: number;
  onLifeChange: (delta: number) => void;
  onLifeSet: (life: number) => void;
  onPoisonChange: (delta: number) => void;
  onExperienceChange: (delta: number) => void;
  onEnergyChange: (delta: number) => void;
  onCommanderDamageChange: (fromPlayerId: number, delta: number) => void;
  onToggleMonarch: () => void;
  onToggleInitiative: () => void;
  onAdvanceDungeon: () => void;
  onDeckNameChange: (deckName: string) => void;
  isAdmin: boolean;
  rotation: number;
  isSelected: boolean;
  enableHoldToAdjust: boolean;
  onSelect: () => void;
}

type OverlayMode = 'none' | 'counters' | 'commander';
type CounterTab = 'poison' | 'experience' | 'energy';

export function FullScreenPlayerPanel({
  player,
  allPlayers,
  playerCount,
  isMonarch,
  hasInitiative,
  dungeonProgress,
  onLifeChange,
  onLifeSet,
  onPoisonChange,
  onExperienceChange,
  onEnergyChange,
  onCommanderDamageChange,
  onToggleMonarch,
  onToggleInitiative,
  onAdvanceDungeon,
  onDeckNameChange,
  isAdmin,
  rotation,
  isSelected,
  enableHoldToAdjust,
  onSelect,
}: FullScreenPlayerPanelProps) {
  // Compact mode for 3+ players
  const isCompact = playerCount >= 3;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [deckEditValue, setDeckEditValue] = useState(player.deckName || '');
  const [animating, setAnimating] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [counterTab, setCounterTab] = useState<CounterTab>('poison');
  const [commanderIndex, setCommanderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLifeActionRef = useRef(0);
  const touchStartX = useRef<number>(0);
  const isSwiping = useRef(false);

  const opponents = allPlayers.filter(p => p.id !== player.id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFocused || !isAdmin || overlayMode !== 'none') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts when user is typing in an input
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      // Prevent defaults for our shortcuts
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '='].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case '+':
        case '=':
          handleLifeChange(e.shiftKey ? 5 : 1);
          break;
        case 'ArrowDown':
        case '-':
          handleLifeChange(e.shiftKey ? -5 : -1);
          break;
        case 'ArrowRight':
          handleLifeChange(5);
          break;
        case 'ArrowLeft':
          handleLifeChange(-5);
          break;
        case '1': handleLifeChange(-1); break;
        case '2': handleLifeChange(-2); break;
        case '3': handleLifeChange(-3); break;
        case '4': handleLifeChange(-4); break;
        case '5': handleLifeChange(-5); break;
        case '6': handleLifeChange(1); break;
        case '7': handleLifeChange(2); break;
        case '8': handleLifeChange(3); break;
        case '9': handleLifeChange(4); break;
        case '0': handleLifeChange(5); break;
        case 'Enter':
        case ' ':
          setEditValue(player.life.toString());
          setIsEditing(true);
          break;
        case 'c':
          setOverlayMode('counters');
          break;
        case 'm':
          onToggleMonarch();
          break;
        case 'i':
          onToggleInitiative();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isAdmin, overlayMode, player.life, onToggleMonarch, onToggleInitiative]);

  const handleLifeChange = (delta: number, fromHold = false) => {
    if (!isAdmin) return;
    if (!fromHold) {
      const now = Date.now();
      if (now - lastLifeActionRef.current < 120) return;
      lastLifeActionRef.current = now;
    }
    // Trigger haptic feedback
    haptics.light();
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

  const handleDeckClick = () => {
    if (!isAdmin || overlayMode !== 'none') return;
    setDeckEditValue(player.deckName || '');
    setIsEditingDeck(true);
  };

  const handleDeckSubmit = () => {
    onDeckNameChange(deckEditValue);
    setIsEditingDeck(false);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const stopHoldToAdjust = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const startHoldToAdjust = (delta: number) => {
    if (!isAdmin || !enableHoldToAdjust) return;
    holdTimeoutRef.current = setTimeout(() => {
      handleLifeChange(delta, true);
      holdIntervalRef.current = setInterval(() => handleLifeChange(delta, true), 150);
    }, 300);
  };

  useEffect(() => {
    return () => {
      stopHoldToAdjust();
      clearLongPress();
    };
  }, []);

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
    stopHoldToAdjust();
  }, []);

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
    stopHoldToAdjust();
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearLongPress();
    stopHoldToAdjust();
  }, []);

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
      ref={panelRef}
      tabIndex={isAdmin ? 0 : -1}
      className={cn(
        "player-panel w-full h-full relative outline-none",
        isFocused && isAdmin && "ring-4 ring-white/50 ring-inset",
        isSelected && "ring-4 ring-white/80 ring-inset"
      )}
      style={{ backgroundColor: `hsl(${player.color})` }}
      onFocus={() => { setIsFocused(true); onSelect(); }}
      onBlur={() => setIsFocused(false)}
      onClick={onSelect}
      onTouchStart={overlayMode === 'none' ? handleTouchStart : handleSwipeStart}
      onTouchMove={overlayMode === 'none' ? handleTouchMove : undefined}
      onTouchEnd={overlayMode === 'none' ? handleTouchEnd : handleSwipeEnd}
      onContextMenu={overlayMode === 'none' ? handleContextMenu : undefined}
      onMouseDown={overlayMode === 'none' ? handleMouseDown : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      role="button"
      aria-label={`${player.name}: ${player.life} life. ${isAdmin ? 'Click to focus, arrow keys to adjust life.' : ''}`}
    >
      {/* Status badges - top */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex",
          isCompact ? "top-1 gap-1" : "top-3 gap-2"
        )}
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      >
        {isMonarch && (
          <div className={cn("rounded-full bg-black/40", isCompact ? "p-0.5" : "p-1.5")} title="Monarch">
            <Crown className={cn("text-yellow-400", isCompact ? "w-3 h-3" : "w-5 h-5")} fill="currentColor" />
          </div>
        )}
        {hasInitiative && (
          <div className={cn("rounded-full bg-black/40 flex items-center", isCompact ? "p-0.5 gap-0.5" : "p-1.5 gap-1")} title={`Initiative: ${DUNGEON_ROOMS[dungeonProgress]}`}>
            <Shield className={cn("text-purple-400", isCompact ? "w-3 h-3" : "w-5 h-5")} fill="currentColor" />
            <span className={cn("font-bold text-purple-300", isCompact ? "text-[8px] pr-0.5" : "text-xs pr-1")}>{dungeonProgress + 1}/4</span>
          </div>
        )}
      </div>

      {/* Main life view */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-full transition-opacity",
          overlayMode !== 'none' && 'opacity-20'
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {isAdmin && overlayMode === 'none' && (
          <button
            onClick={() => handleLifeChange(1)}
            className={cn("life-button", isCompact && "compact", isCompact ? "top-2" : "top-8 sm:top-12")}
            aria-label="Increase life by 1"
            onPointerDown={() => startHoldToAdjust(1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
          >
            +
          </button>
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
            className="life-number text-[18vmin] w-[4ch] text-center bg-transparent outline-none"
            aria-label="Edit life total"
          />
        ) : (
          <button
            onClick={handleLifeClick}
            disabled={!isAdmin || overlayMode !== 'none'}
            className={cn(
              'life-number leading-none transition-transform',
              isCompact ? 'text-[16vmin]' : 'text-[22vmin]',
              animating && 'animate-pulse-scale',
              isAdmin && overlayMode === 'none' && 'cursor-pointer active:scale-95'
            )}
            aria-label={`Life total: ${player.life}. Click to edit.`}
          >
            {player.life}
          </button>
        )}

        {/* Deck name / Commander - hidden in compact mode, show only if set */}
        {!isCompact && (
          isEditingDeck ? (
            <div className="flex flex-col items-center mt-2">
              <input
                type="text"
                value={deckEditValue}
                onChange={(e) => setDeckEditValue(e.target.value)}
                onBlur={handleDeckSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDeckSubmit();
                  if (e.key === 'Escape') {
                    setDeckEditValue(player.deckName || '');
                    setIsEditingDeck(false);
                  }
                }}
                placeholder="Deck / Commander..."
                className="px-3 py-1.5 rounded-lg bg-black/30 text-white text-sm text-center outline-none border border-white/20 focus:border-white/50 max-w-[80%]"
                autoFocus
                aria-label="Edit deck name"
              />
              <span className="mt-1 text-[10px] text-white/50">Enter to save · Esc to cancel</span>
            </div>
          ) : (
            <button
              onClick={handleDeckClick}
              disabled={!isAdmin || overlayMode !== 'none'}
              className={cn(
                'mt-1 px-3 py-1 rounded-lg text-sm transition-all',
                player.deckName 
                  ? 'bg-black/30 text-white/90' 
                  : 'bg-black/20 text-white/50 italic',
                isAdmin && overlayMode === 'none' && 'cursor-pointer hover:bg-black/40'
              )}
              aria-label={player.deckName ? `Deck: ${player.deckName}. Click to edit.` : 'Click to add deck name'}
            >
              {player.deckName || 'Add deck/commander'}
            </button>
          )
        )}

        {isAdmin && overlayMode === 'none' && (
          <button
            onClick={() => handleLifeChange(-1)}
            className={cn("life-button", isCompact && "compact", isCompact ? "bottom-2" : "bottom-8 sm:bottom-12")}
            aria-label="Decrease life by 1"
            onPointerDown={() => startHoldToAdjust(-1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
          >
            −
          </button>
        )}

        {/* Counter indicators + Counters button */}
        {overlayMode === 'none' && (
          <div className={cn(
            "absolute left-1 flex flex-col gap-0.5",
            isCompact ? "bottom-8" : "bottom-16 sm:bottom-20 left-2 sm:left-4 gap-1"
          )}>
            {/* Counters quick-access button for mobile */}
            {isAdmin && (
              <button
                onClick={() => setOverlayMode('counters')}
                className={cn(
                  "flex items-center gap-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-colors",
                  isCompact ? "px-1 py-0.5" : "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg gap-1"
                )}
                aria-label="Open counters menu"
              >
                <Skull className={cn(isCompact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4")} />
                <span className={cn("font-medium", isCompact ? "text-[8px]" : "text-[10px] sm:text-xs")}>
                  {isCompact ? "•••" : "Counters"}
                </span>
              </button>
            )}
            {player.poison > 0 && (
              <div className={cn(
                "flex items-center gap-0.5 rounded-md bg-black/50 backdrop-blur-sm",
                isCompact ? "px-1 py-0.5" : "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg gap-1"
              )} aria-label={`Poison: ${player.poison}`}>
                <Skull className={cn("text-green-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4")} />
                <span className={cn("font-display text-green-400 font-bold", isCompact ? "text-[10px]" : "text-xs sm:text-sm")}>{player.poison}</span>
              </div>
            )}
            {player.experience > 0 && (
              <div className={cn(
                "flex items-center gap-0.5 rounded-md bg-black/50 backdrop-blur-sm",
                isCompact ? "px-1 py-0.5" : "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg gap-1"
              )} aria-label={`Experience: ${player.experience}`}>
                <Sparkles className={cn("text-yellow-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4")} />
                <span className={cn("font-display text-yellow-400 font-bold", isCompact ? "text-[10px]" : "text-xs sm:text-sm")}>{player.experience}</span>
              </div>
            )}
            {player.energy > 0 && (
              <div className={cn(
                "flex items-center gap-0.5 rounded-md bg-black/50 backdrop-blur-sm",
                isCompact ? "px-1 py-0.5" : "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg gap-1"
              )} aria-label={`Energy: ${player.energy}`}>
                <Zap className={cn("text-blue-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4")} />
                <span className={cn("font-display text-blue-400 font-bold", isCompact ? "text-[10px]" : "text-xs sm:text-sm")}>{player.energy}</span>
              </div>
            )}
          </div>
        )}

        {/* Commander damage indicators */}
        {overlayMode === 'none' && Object.keys(player.commanderDamage).length > 0 && (
          <div className={cn(
            "absolute flex gap-0.5",
            isCompact ? "bottom-8 right-1" : "bottom-16 sm:bottom-20 right-2 sm:right-4 gap-1"
          )}>
            {opponents.map(opp => {
              const dmg = player.commanderDamage[opp.id];
              if (!dmg) return null;
              return (
                <div
                  key={opp.id}
                  className={cn(
                    "rounded-md font-display font-bold",
                    isCompact ? "px-1 py-0.5 text-[8px]" : "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs"
                  )}
                  style={{ backgroundColor: `hsl(${opp.color})`, color: 'rgba(0,0,0,0.8)' }}
                  aria-label={`Commander damage from ${opp.name}: ${dmg}`}
                >
                  {dmg}
                </div>
              );
            })}
          </div>
        )}

        {/* Keyboard hint */}
        {isAdmin && overlayMode === 'none' && isFocused && (
          <div 
            className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-black/50 backdrop-blur-sm"
            style={{ color: 'white' }}
          >
            ↑↓ / ± Life · C Counters · M Monarch · I Initiative · U Undo · R Reset
          </div>
        )}
      </div>

      {/* Counters Overlay - WCAG compliant with solid background */}
      {overlayMode === 'counters' && (
        <div 
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900/95 backdrop-blur-md",
            isCompact ? "p-1 gap-1" : "p-3 sm:p-4"
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
          role="dialog"
          aria-label="Counter overlay"
        >
          <button
            onClick={closeOverlay}
            className={cn(
              "absolute rounded-full bg-white/10 hover:bg-white/20 transition-colors",
              isCompact ? "top-1 right-1 p-1" : "top-2 right-2 sm:top-4 sm:right-4 p-2"
            )}
            aria-label="Close overlay"
          >
            <X className={cn("text-white", isCompact ? "w-3 h-3" : "w-4 h-4 sm:w-5 sm:h-5")} />
          </button>

          {/* Tab selector - more compact on mobile */}
          <div className={cn("flex role='tablist'", isCompact ? "gap-0.5 mb-1" : "gap-1 sm:gap-2 mb-4 sm:mb-6")}>
            {(['poison', 'experience', 'energy'] as const).map(tab => {
              const Icon = tab === 'poison' ? Skull : tab === 'experience' ? Sparkles : Zap;
              const color = tab === 'poison' ? 'text-green-400' : tab === 'experience' ? 'text-yellow-400' : 'text-blue-400';
              const bgColor = tab === 'poison' ? 'bg-green-500/30' : tab === 'experience' ? 'bg-yellow-500/30' : 'bg-blue-500/30';
              const isActive = counterTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setCounterTab(tab)}
                  className={cn(
                    'flex items-center transition-all font-medium',
                    isCompact 
                      ? 'px-1.5 py-1 rounded gap-0.5 text-[10px]' 
                      : 'px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl gap-1 sm:gap-2',
                    isActive ? bgColor : 'bg-white/10 hover:bg-white/20'
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${tab} counter`}
                >
                  <Icon className={cn(isCompact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5', isActive ? color : 'text-white/60')} />
                  <span className={cn('capitalize', isCompact ? 'text-[10px]' : 'text-xs sm:text-sm', isActive ? color : 'text-white/60')}>
                    {tab}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Counter value */}
          <div className={cn("flex items-center", isCompact ? "gap-2" : "gap-4 sm:gap-6")}>
            <button
              onClick={() => handleCounterChange(-1)}
              className={cn(
                "rounded-full flex items-center justify-center font-light bg-white/20 hover:bg-white/30 text-white transition-colors",
                isCompact ? "w-8 h-8 text-xl" : "w-12 h-12 sm:w-16 sm:h-16 text-3xl sm:text-4xl"
              )}
              aria-label={`Decrease ${counterTab}`}
            >
              −
            </button>
            <div className="flex flex-col items-center">
              <CounterIcon className={cn(isCompact ? 'w-5 h-5' : 'w-8 h-8 sm:w-10 sm:h-10 mb-1 sm:mb-2', counterColor)} />
              <span className={cn('font-display leading-none', isCompact ? 'text-4xl' : 'text-[12vmin] sm:text-[14vmin]', counterColor)}>
                {getCounterValue()}
              </span>
            </div>
            <button
              onClick={() => handleCounterChange(1)}
              className={cn(
                "rounded-full flex items-center justify-center font-light bg-white/20 hover:bg-white/30 text-white transition-colors",
                isCompact ? "w-8 h-8 text-xl" : "w-12 h-12 sm:w-16 sm:h-16 text-3xl sm:text-4xl"
              )}
              aria-label={`Increase ${counterTab}`}
            >
              +
            </button>
          </div>

          {/* Status toggles - more compact on mobile */}
          <div className={cn("flex flex-wrap justify-center", isCompact ? "gap-1 mt-1" : "gap-2 sm:gap-3 mt-4 sm:mt-8")}>
            <button
              onClick={onToggleMonarch}
              className={cn(
                'font-medium flex items-center transition-all',
                isCompact 
                  ? 'px-2 py-1 rounded text-[10px] gap-1' 
                  : 'px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl gap-1.5 sm:gap-2 text-sm sm:text-base',
                isMonarch ? 'bg-yellow-500/40 text-yellow-300' : 'bg-white/10 hover:bg-white/20 text-white'
              )}
              aria-pressed={isMonarch}
            >
              <Crown className={cn(isCompact ? "w-3 h-3" : "w-4 h-4 sm:w-5 sm:h-5")} fill={isMonarch ? 'currentColor' : 'none'} />
              Monarch
            </button>
            <button
              onClick={onToggleInitiative}
              className={cn(
                'font-medium flex items-center transition-all',
                isCompact 
                  ? 'px-2 py-1 rounded text-[10px] gap-1' 
                  : 'px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl gap-1.5 sm:gap-2 text-sm sm:text-base',
                hasInitiative ? 'bg-purple-500/40 text-purple-300' : 'bg-white/10 hover:bg-white/20 text-white'
              )}
              aria-pressed={hasInitiative}
            >
              <Shield className={cn(isCompact ? "w-3 h-3" : "w-4 h-4 sm:w-5 sm:h-5")} fill={hasInitiative ? 'currentColor' : 'none'} />
              Initiative
            </button>
            <button
              onClick={switchToCommander}
              className={cn(
                'font-medium flex items-center bg-white/10 hover:bg-white/20 text-white transition-all',
                isCompact 
                  ? 'px-2 py-1 rounded text-[10px] gap-1' 
                  : 'px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl gap-1.5 sm:gap-2 text-sm sm:text-base'
              )}
            >
              <Swords className={cn(isCompact ? "w-3 h-3" : "w-4 h-4 sm:w-5 sm:h-5")} />
              Cmd Dmg
            </button>
          </div>

          {/* Dungeon progress (only show if has initiative and not compact) */}
          {hasInitiative && !isCompact && (
            <div className="mt-4 flex flex-col items-center">
              <div className="text-sm text-purple-300 mb-2">Undercity: {DUNGEON_ROOMS[dungeonProgress]}</div>
              <div className="flex gap-2 items-center">
                {DUNGEON_ROOMS.map((room, idx) => (
                  <div
                    key={room}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all',
                      idx <= dungeonProgress 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 text-white/40'
                    )}
                    title={room}
                  >
                    {idx + 1}
                  </div>
                ))}
                <button
                  onClick={onAdvanceDungeon}
                  disabled={dungeonProgress >= 3}
                  className={cn(
                    'ml-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    dungeonProgress >= 3 
                      ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                      : 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/50'
                  )}
                >
                  Advance →
                </button>
              </div>
            </div>
          )}

          {!isCompact && (
            <button
              onClick={switchToCommander}
              className="mt-6 px-5 py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Commander Damage →
            </button>
          )}
        </div>
      )}

      {/* Commander Damage Overlay - WCAG compliant */}
      {overlayMode === 'commander' && currentOpponent && (
        <div 
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900/95 backdrop-blur-md",
            isCompact ? "p-1" : "p-4"
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
          role="dialog"
          aria-label="Commander damage overlay"
        >
          <button
            onClick={closeOverlay}
            className={cn(
              "absolute rounded-full bg-white/10 hover:bg-white/20 transition-colors",
              isCompact ? "top-1 right-1 p-1" : "top-4 right-4 p-2"
            )}
            aria-label="Close overlay"
          >
            <X className={cn("text-white", isCompact ? "w-3 h-3" : "w-5 h-5")} />
          </button>

          <div className={cn("text-center", isCompact ? "mb-1" : "mb-4")}>
            <span className={cn("font-display text-white uppercase tracking-wider", isCompact ? "text-xs" : "text-xl")}>
              Cmd Dmg
            </span>
            <div className={cn("text-white/70", isCompact ? "text-[10px]" : "text-sm mt-1")}>
              from {currentOpponent.name}
            </div>
          </div>

          <div className={cn("flex items-center", isCompact ? "gap-2" : "gap-4")}>
            {opponents.length > 1 && (
              <button
                onClick={() => setCommanderIndex(prev => (prev - 1 + opponents.length) % opponents.length)}
                className={cn("rounded-full bg-white/10 hover:bg-white/20 transition-colors", isCompact ? "p-1" : "p-3")}
                aria-label="Previous opponent"
              >
                <ChevronLeft className={cn("text-white", isCompact ? "w-4 h-4" : "w-6 h-6")} />
              </button>
            )}

            <div 
              className={cn("rounded-2xl flex flex-col items-center", isCompact ? "px-4 py-2 rounded-lg" : "px-10 py-6")}
              style={{ backgroundColor: `hsl(${currentOpponent.color})` }}
            >
              <div className={cn("flex items-center", isCompact ? "gap-3" : "gap-8")}>
                <button
                  onClick={() => onCommanderDamageChange(currentOpponent.id, -1)}
                  className={cn(
                    "rounded-full flex items-center justify-center font-light bg-black/30 hover:bg-black/40 text-white transition-colors",
                    isCompact ? "w-8 h-8 text-xl" : "w-14 h-14 text-3xl"
                  )}
                  aria-label="Decrease commander damage"
                >
                  −
                </button>
                <span className={cn("font-display leading-none", isCompact ? "text-4xl" : "text-[12vmin]")} style={{ color: 'rgba(0,0,0,0.8)' }}>
                  {commanderDamage}
                </span>
                <button
                  onClick={() => onCommanderDamageChange(currentOpponent.id, 1)}
                  className={cn(
                    "rounded-full flex items-center justify-center font-light bg-black/30 hover:bg-black/40 text-white transition-colors",
                    isCompact ? "w-8 h-8 text-xl" : "w-14 h-14 text-3xl"
                  )}
                  aria-label="Increase commander damage"
                >
                  +
                </button>
              </div>
            </div>

            {opponents.length > 1 && (
              <button
                onClick={() => setCommanderIndex(prev => (prev + 1) % opponents.length)}
                className={cn("rounded-full bg-white/10 hover:bg-white/20 transition-colors", isCompact ? "p-1" : "p-3")}
                aria-label="Next opponent"
              >
                <ChevronRight className={cn("text-white", isCompact ? "w-4 h-4" : "w-6 h-6")} />
              </button>
            )}
          </div>

          {opponents.length > 1 && (
            <div className={cn("flex role='tablist'", isCompact ? "gap-1 mt-1" : "gap-2 mt-4")}>
              {opponents.map((opp, idx) => (
                <button
                  key={opp.id}
                  onClick={() => setCommanderIndex(idx)}
                  className={cn("rounded-full transition-all", isCompact ? "w-2.5 h-2.5" : "w-4 h-4")}
                  style={{ 
                    backgroundColor: idx === commanderIndex ? `hsl(${opp.color})` : 'rgba(255,255,255,0.3)',
                    transform: idx === commanderIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`Select ${opp.name}`}
                  aria-selected={idx === commanderIndex}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setOverlayMode('counters')}
            className={cn(
              "rounded-lg text-white/70 hover:text-white transition-colors",
              isCompact ? "mt-1 px-2 py-1 text-[10px]" : "mt-6 px-4 py-2 text-sm"
            )}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
