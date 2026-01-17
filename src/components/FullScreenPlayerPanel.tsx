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

  // Calculate font size based on digits
  const getLifeFontSize = () => {
    const digits = Math.abs(player.life).toString().length + (player.life < 0 ? 1 : 0);
    if (isCompact) {
      if (digits <= 2) return 'text-[18vmin]';
      if (digits <= 3) return 'text-[14vmin]';
      return 'text-[10vmin]';
    }
    if (digits <= 2) return 'text-[24vmin]';
    if (digits <= 3) return 'text-[18vmin]';
    return 'text-[14vmin]';
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
        {/* Status badges - Monarch & Initiative */}
        {(isMonarch || hasInitiative) && (
          <div className={cn(
            "absolute flex gap-1.5 z-10",
            isCompact ? "top-2" : "top-4"
          )}>
            {isMonarch && (
              <div className={cn(
                "rounded-full bg-black/30 backdrop-blur-sm",
                isCompact ? "p-1" : "p-2"
              )}>
                <Crown 
                  className={cn("text-yellow-300", isCompact ? "w-4 h-4" : "w-5 h-5")} 
                  fill="currentColor" 
                />
              </div>
            )}
            {hasInitiative && (
              <div className={cn(
                "rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-1",
                isCompact ? "px-1.5 py-1" : "px-2 py-1.5"
              )}>
                <Shield 
                  className={cn("text-purple-300", isCompact ? "w-4 h-4" : "w-5 h-5")} 
                  fill="currentColor" 
                />
                <span className={cn("text-purple-300 font-bold", isCompact ? "text-xs" : "text-sm")}>
                  {dungeonProgress + 1}/4
                </span>
              </div>
            )}
          </div>
        )}

        {/* Plus button */}
        {isAdmin && !showCounters && (
          <button
            onClick={() => handleLifeChange(1)}
            onPointerDown={() => startHoldToAdjust(1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className={cn(
              "life-button",
              isCompact && "compact",
              isCompact ? "top-12" : "top-10 sm:top-14"
            )}
            aria-label="Increase life"
          >
            +
          </button>
        )}

        {/* Life total */}
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
              "life-number text-center bg-black/20 rounded-2xl outline-none",
              isCompact ? "w-24 text-[14vmin] px-2 py-1" : "w-36 text-[20vmin] px-3 py-2"
            )}
            aria-label="Edit life total"
          />
        ) : (
          <button
            onClick={handleLifeClick}
            disabled={!isAdmin || showCounters}
            className={cn(
              'life-number leading-none transition-transform',
              getLifeFontSize(),
              animating && 'animate-pulse-scale',
              isAdmin && !showCounters && 'cursor-pointer active:scale-95'
            )}
            aria-label={`Life: ${player.life}. Tap to edit.`}
          >
            {player.life}
          </button>
        )}

        {/* Player name */}
        <div className={cn(
          "absolute text-center",
          isCompact ? "bottom-[22%]" : "bottom-[20%]"
        )}>
          <span 
            className={cn(
              "font-medium tracking-wide uppercase",
              isCompact ? "text-[10px]" : "text-xs sm:text-sm"
            )}
            style={{ color: 'rgba(0,0,0,0.45)' }}
          >
            {player.name}
          </span>
        </div>

        {/* Minus button */}
        {isAdmin && !showCounters && (
          <button
            onClick={() => handleLifeChange(-1)}
            onPointerDown={() => startHoldToAdjust(-1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className={cn(
              "life-button",
              isCompact && "compact",
              isCompact ? "bottom-12" : "bottom-10 sm:bottom-14"
            )}
            aria-label="Decrease life"
          >
            −
          </button>
        )}

        {/* Counter badges - tappable to open counter sheet */}
        {!showCounters && (
          <div className={cn(
            "absolute flex flex-wrap gap-1",
            isCompact ? "bottom-3 left-2" : "bottom-5 left-3 gap-1.5"
          )}>
            {/* Always show counters button when admin */}
            {isAdmin && (
              <button
                onClick={() => setShowCounters(true)}
                className={cn(
                  "flex items-center gap-1 rounded-lg bg-black/40 backdrop-blur-sm transition-all hover:bg-black/50",
                  isCompact ? "px-2 py-1" : "px-2.5 py-1.5"
                )}
                aria-label="Open counters"
              >
                <Skull className={cn("text-white/70", isCompact ? "w-3 h-3" : "w-4 h-4")} />
                {!isCompact && (
                  <span className="text-white/70 text-xs font-medium">Counters</span>
                )}
              </button>
            )}

            {/* Show individual counter badges when they have values */}
            {player.poison > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-1 rounded-lg bg-green-900/60 backdrop-blur-sm",
                  isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                )}
              >
                <Skull className={cn("text-green-400", isCompact ? "w-3 h-3" : "w-4 h-4")} />
                <span className={cn("font-display text-green-400", isCompact ? "text-xs" : "text-sm")}>
                  {player.poison}
                </span>
              </button>
            )}
            {player.experience > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-1 rounded-lg bg-yellow-900/60 backdrop-blur-sm",
                  isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                )}
              >
                <Sparkles className={cn("text-yellow-400", isCompact ? "w-3 h-3" : "w-4 h-4")} />
                <span className={cn("font-display text-yellow-400", isCompact ? "text-xs" : "text-sm")}>
                  {player.experience}
                </span>
              </button>
            )}
            {player.energy > 0 && (
              <button
                onClick={() => isAdmin && setShowCounters(true)}
                className={cn(
                  "flex items-center gap-1 rounded-lg bg-blue-900/60 backdrop-blur-sm",
                  isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                )}
              >
                <Zap className={cn("text-blue-400", isCompact ? "w-3 h-3" : "w-4 h-4")} />
                <span className={cn("font-display text-blue-400", isCompact ? "text-xs" : "text-sm")}>
                  {player.energy}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Commander damage badges - right side */}
        {!showCounters && hasCommanderDamage && (
          <button
            onClick={() => isAdmin && setShowCounters(true)}
            className={cn(
              "absolute flex items-center gap-1 rounded-lg bg-orange-900/60 backdrop-blur-sm",
              isCompact ? "bottom-3 right-2 px-1.5 py-0.5" : "bottom-5 right-3 px-2 py-1"
            )}
          >
            <Swords className={cn("text-orange-400", isCompact ? "w-3 h-3" : "w-4 h-4")} />
            <span className={cn("font-display text-orange-400", isCompact ? "text-xs" : "text-sm")}>
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
