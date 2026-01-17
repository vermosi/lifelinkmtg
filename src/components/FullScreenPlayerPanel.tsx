import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, DUNGEON_ROOMS } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skull, Crown, Zap, Sparkles, Shield, Swords } from 'lucide-react';
import { CounterSheet } from './CounterSheet';

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
  const isCompact = playerCount >= 3;
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animating, setAnimating] = useState(false);
  const [showCounters, setShowCounters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLifeActionRef = useRef(0);

  // Check if any counters are active
  const hasActiveCounters = player.poison > 0 || player.experience > 0 || player.energy > 0;
  const hasCommanderDamage = Object.values(player.commanderDamage).some(v => v > 0);
  const totalCommanderDamage = Object.values(player.commanderDamage).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFocused || !isAdmin || showCounters || isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case '+':
        case '=':
          e.preventDefault();
          handleLifeChange(e.shiftKey ? 5 : 1);
          break;
        case 'ArrowDown':
        case '-':
          e.preventDefault();
          handleLifeChange(e.shiftKey ? -5 : -1);
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setShowCounters(true);
          break;
        case 'm':
          e.preventDefault();
          onToggleMonarch();
          break;
        case 'i':
          e.preventDefault();
          onToggleInitiative();
          break;
        case 'Escape':
          setShowCounters(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isAdmin, showCounters, isMobile, onToggleMonarch, onToggleInitiative]);

  const handleLifeChange = useCallback((delta: number, fromHold = false) => {
    if (!isAdmin) return;
    if (!fromHold) {
      const now = Date.now();
      if (now - lastLifeActionRef.current < 100) return;
      lastLifeActionRef.current = now;
    }
    haptics.light();
    onLifeChange(delta);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
  }, [isAdmin, onLifeChange]);

  const handleLifeClick = () => {
    if (!isAdmin || showCounters) return;
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

  const stopHoldToAdjust = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHoldToAdjust = useCallback((delta: number) => {
    if (!isAdmin || !enableHoldToAdjust) return;
    holdTimeoutRef.current = setTimeout(() => {
      handleLifeChange(delta, true);
      let speed = 150;
      let count = 0;
      holdIntervalRef.current = setInterval(() => {
        handleLifeChange(delta, true);
        count++;
        if (count === 5 && speed > 80) {
          clearInterval(holdIntervalRef.current!);
          speed = 80;
          holdIntervalRef.current = setInterval(() => handleLifeChange(delta, true), speed);
        }
      }, speed);
    }, 250);
  }, [isAdmin, enableHoldToAdjust, handleLifeChange]);

  useEffect(() => {
    return () => stopHoldToAdjust();
  }, [stopHoldToAdjust]);

  // Calculate font size based on digits - mobile-first with max sizes
  const getLifeFontSize = () => {
    const digits = Math.abs(player.life).toString().length + (player.life < 0 ? 1 : 0);
    if (isCompact) {
      // 3-4 players: smaller panels, optimized for 5" screens
      if (digits <= 2) return 'text-[min(16vmin,72px)]';
      if (digits <= 3) return 'text-[min(12vmin,56px)]';
      return 'text-[min(9vmin,44px)]';
    }
    // 1-2 players: larger panels
    if (digits <= 2) return 'text-[min(22vmin,100px)]';
    if (digits <= 3) return 'text-[min(16vmin,76px)]';
    return 'text-[min(12vmin,60px)]';
  };

  return (
    <div
      ref={panelRef}
      tabIndex={isAdmin ? 0 : -1}
      className={cn(
        "player-panel w-full h-full relative outline-none",
        isFocused && isAdmin && "ring-2 ring-white/30 ring-inset",
        isSelected && "ring-2 ring-white/50 ring-inset"
      )}
      style={{ backgroundColor: `hsl(${player.color})` }}
      onFocus={() => { setIsFocused(true); onSelect(); }}
      onBlur={() => setIsFocused(false)}
      onClick={onSelect}
      role="button"
      aria-label={`${player.name}: ${player.life} life`}
    >
      {/* Main content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Status badges - Monarch & Initiative - mobile optimized */}
        {(isMonarch || hasInitiative) && (
          <div className={cn(
            "absolute flex gap-1 z-10",
            isCompact ? "top-1" : "top-2"
          )}>
            {isMonarch && (
              <div className={cn(
                "rounded-full bg-black/40 backdrop-blur-sm",
                isCompact ? "p-1" : "p-1.5"
              )}>
                <Crown 
                  className={cn("text-yellow-300", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} 
                  fill="currentColor" 
                />
              </div>
            )}
            {hasInitiative && (
              <div className={cn(
                "rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-0.5",
                isCompact ? "px-1 py-0.5" : "px-1.5 py-1"
              )}>
                <Shield 
                  className={cn("text-purple-300", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} 
                  fill="currentColor" 
                />
                <span className={cn("text-purple-300 font-bold", isCompact ? "text-[10px]" : "text-xs")}>
                  {dungeonProgress + 1}/4
                </span>
              </div>
            )}
          </div>
        )}

        {/* Plus button - large tap zone for mobile */}
        {isAdmin && !showCounters && (
          <button
            onClick={() => handleLifeChange(1)}
            onPointerDown={() => startHoldToAdjust(1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className="life-btn-zone life-btn-zone-plus"
            aria-label="Increase life"
          >
            <span className={cn(
              "life-btn-icon-circle",
              isCompact ? "w-9 h-9 text-lg" : "w-11 h-11 text-xl"
            )}>+</span>
          </button>
        )}

        {/* Life total - centered with pointer-events for tap-to-edit */}
        <div className="relative z-20 pointer-events-none">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className={cn(
                "life-number text-center bg-black/20 rounded-xl outline-none pointer-events-auto",
                isCompact ? "w-20 text-[min(12vmin,52px)] px-2 py-1" : "w-28 text-[min(18vmin,80px)] px-3 py-2"
              )}
              aria-label="Edit life total"
            />
          ) : (
            <button
              onClick={handleLifeClick}
              disabled={!isAdmin || showCounters}
              className={cn(
                'life-number leading-none transition-transform pointer-events-auto',
                getLifeFontSize(),
                animating && 'animate-pulse-scale',
                isAdmin && !showCounters && 'cursor-pointer active:scale-95'
              )}
              aria-label={`Life: ${player.life}. Tap to edit.`}
            >
              {player.life}
            </button>
          )}
        </div>

        {/* Player name - fixed at bottom */}
        <div className={cn(
          "absolute left-0 right-0 text-center z-10",
          isCompact ? "bottom-1" : "bottom-2"
        )}>
          <span 
            className={cn(
              "font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-black/15",
              isCompact ? "text-[9px]" : "text-[10px]"
            )}
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            {player.name}
          </span>
        </div>

        {/* Minus button - large tap zone for mobile */}
        {isAdmin && !showCounters && (
          <button
            onClick={() => handleLifeChange(-1)}
            onPointerDown={() => startHoldToAdjust(-1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className="life-btn-zone life-btn-zone-minus"
            aria-label="Decrease life"
          >
            <span className={cn(
              "life-btn-icon-circle",
              isCompact ? "w-9 h-9 text-lg" : "w-11 h-11 text-xl"
            )}>−</span>
          </button>
        )}

        {/* Counter badges - top left, compact for mobile */}
        {!showCounters && (
          <div className={cn(
            "absolute flex flex-wrap gap-0.5 z-30",
            isCompact ? "top-1 left-1" : "top-2 left-2 gap-1"
          )}>
            {/* Counters button when admin */}
            {isAdmin && (
              <button
                onClick={() => setShowCounters(true)}
                className={cn(
                  "flex items-center gap-0.5 rounded-md bg-black/40 backdrop-blur-sm active:bg-black/50",
                  isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                )}
                aria-label="Open counters"
              >
                <Skull className={cn("text-white/70", isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} />
              </button>
            )}

            {/* Show counter badges when they have values */}
            {player.poison > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-0.5 rounded-md bg-green-900/60 backdrop-blur-sm",
                  isCompact ? "px-1 py-0.5" : "px-1.5 py-0.5"
                )}
              >
                <Skull className={cn("text-green-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                <span className={cn("font-display text-green-400", isCompact ? "text-[10px]" : "text-xs")}>
                  {player.poison}
                </span>
              </button>
            )}
            {player.experience > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-0.5 rounded-md bg-yellow-900/60 backdrop-blur-sm",
                  isCompact ? "px-1 py-0.5" : "px-1.5 py-0.5"
                )}
              >
                <Sparkles className={cn("text-yellow-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                <span className={cn("font-display text-yellow-400", isCompact ? "text-[10px]" : "text-xs")}>
                  {player.experience}
                </span>
              </button>
            )}
            {player.energy > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-0.5 rounded-md bg-blue-900/60 backdrop-blur-sm",
                  isCompact ? "px-1 py-0.5" : "px-1.5 py-0.5"
                )}
              >
                <Zap className={cn("text-blue-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                <span className={cn("font-display text-blue-400", isCompact ? "text-[10px]" : "text-xs")}>
                  {player.energy}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Commander damage badge - top right */}
        {!showCounters && hasCommanderDamage && (
          <button
            onClick={() => isAdmin && setShowCounters(true)}
            className={cn(
              "absolute z-30 flex items-center gap-0.5 rounded-md bg-orange-900/60 backdrop-blur-sm",
              isCompact ? "top-1 right-1 px-1 py-0.5" : "top-2 right-2 px-1.5 py-0.5"
            )}
          >
            <Swords className={cn("text-orange-400", isCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
            <span className={cn("font-display text-orange-400", isCompact ? "text-[10px]" : "text-xs")}>
              {totalCommanderDamage}
            </span>
          </button>
        )}
      </div>

      {/* Counter Sheet overlay */}
      <CounterSheet
        isOpen={showCounters}
        onClose={() => setShowCounters(false)}
        player={player}
        allPlayers={allPlayers}
        isMonarch={isMonarch}
        hasInitiative={hasInitiative}
        onPoisonChange={onPoisonChange}
        onExperienceChange={onExperienceChange}
        onEnergyChange={onEnergyChange}
        onCommanderDamageChange={onCommanderDamageChange}
        onToggleMonarch={onToggleMonarch}
        onToggleInitiative={onToggleInitiative}
        rotation={rotation}
      />
    </div>
  );
}
