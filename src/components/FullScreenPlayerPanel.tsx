import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, DUNGEON_ROOMS } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skull, Crown, Zap, Sparkles, Shield, Swords, X } from 'lucide-react';

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

type CounterMode = 'life' | 'poison' | 'experience' | 'energy' | 'commander';

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
  const [counterMode, setCounterMode] = useState<CounterMode>('life');
  const [isFocused, setIsFocused] = useState(false);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef(0);

  const opponents = allPlayers.filter(p => p.id !== player.id);
  const totalCommanderDamage = Object.values(player.commanderDamage).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Get current value based on mode
  const getCurrentValue = () => {
    switch (counterMode) {
      case 'poison': return player.poison;
      case 'experience': return player.experience;
      case 'energy': return player.energy;
      case 'commander': return totalCommanderDamage;
      default: return player.life;
    }
  };

  // Get current change handler
  const handleCounterChange = useCallback((delta: number, fromHold = false) => {
    if (!isAdmin) return;
    if (!fromHold) {
      const now = Date.now();
      if (now - lastActionRef.current < 100) return;
      lastActionRef.current = now;
    }
    haptics.light();
    
    switch (counterMode) {
      case 'poison': onPoisonChange(delta); break;
      case 'experience': onExperienceChange(delta); break;
      case 'energy': onEnergyChange(delta); break;
      default: onLifeChange(delta); break;
    }
    
    setLastDelta(delta);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      setLastDelta(null);
    }, 300);
  }, [isAdmin, counterMode, onLifeChange, onPoisonChange, onExperienceChange, onEnergyChange]);

  const handleValueClick = () => {
    if (!isAdmin || counterMode !== 'life') return;
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
      handleCounterChange(delta, true);
      let speed = 150;
      let count = 0;
      holdIntervalRef.current = setInterval(() => {
        handleCounterChange(delta, true);
        count++;
        if (count === 5 && speed > 80) {
          clearInterval(holdIntervalRef.current!);
          speed = 80;
          holdIntervalRef.current = setInterval(() => handleCounterChange(delta, true), speed);
        }
      }, speed);
    }, 250);
  }, [isAdmin, enableHoldToAdjust, handleCounterChange]);

  useEffect(() => {
    return () => stopHoldToAdjust();
  }, [stopHoldToAdjust]);

  // Calculate font size based on digits and mode
  const getValueFontSize = () => {
    const val = getCurrentValue();
    const digits = Math.abs(val).toString().length + (val < 0 ? 1 : 0);
    
    // Counters get smaller display
    if (counterMode !== 'life') {
      if (isCompact) return 'text-[min(14vmin,56px)]';
      return 'text-[min(18vmin,72px)]';
    }
    
    if (isCompact) {
      if (digits <= 2) return 'text-[min(16vmin,72px)]';
      if (digits <= 3) return 'text-[min(12vmin,56px)]';
      return 'text-[min(9vmin,44px)]';
    }
    if (digits <= 2) return 'text-[min(22vmin,100px)]';
    if (digits <= 3) return 'text-[min(16vmin,76px)]';
    return 'text-[min(12vmin,60px)]';
  };

  const getModeColor = () => {
    switch (counterMode) {
      case 'poison': return 'text-green-400';
      case 'experience': return 'text-yellow-400';
      case 'energy': return 'text-blue-400';
      case 'commander': return 'text-orange-400';
      default: return '';
    }
  };

  const getModeIcon = () => {
    switch (counterMode) {
      case 'poison': return Skull;
      case 'experience': return Sparkles;
      case 'energy': return Zap;
      case 'commander': return Swords;
      default: return null;
    }
  };

  const ModeIcon = getModeIcon();

  return (
    <div
      ref={panelRef}
      tabIndex={isAdmin ? 0 : -1}
      className={cn(
        "player-panel w-full h-full relative outline-none overflow-hidden",
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
      {/* Rotated content container - everything stays within bounds */}
      <div
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Top section: Counter mode selector */}
        <div className={cn(
          "flex justify-center items-center gap-1 shrink-0",
          isCompact ? "pt-1 pb-0.5 px-1" : "pt-2 pb-1 px-2"
        )}>
          {/* Life button (always show) */}
          <button
            onClick={() => setCounterMode('life')}
            className={cn(
              "rounded-full transition-all flex items-center justify-center",
              isCompact ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[10px]",
              counterMode === 'life' 
                ? "bg-black/40 text-white font-bold" 
                : "bg-black/20 text-white/60"
            )}
          >
            ♥
          </button>
          
          {/* Poison */}
          <button
            onClick={() => setCounterMode('poison')}
            className={cn(
              "rounded-full transition-all flex items-center justify-center gap-0.5",
              isCompact ? "min-w-6 h-6 px-1" : "min-w-8 h-8 px-1.5",
              counterMode === 'poison' 
                ? "bg-green-500/40 text-green-300" 
                : "bg-black/20 text-white/60"
            )}
          >
            <Skull className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            {player.poison > 0 && (
              <span className={isCompact ? "text-[9px]" : "text-[10px]"}>{player.poison}</span>
            )}
          </button>
          
          {/* Experience */}
          <button
            onClick={() => setCounterMode('experience')}
            className={cn(
              "rounded-full transition-all flex items-center justify-center gap-0.5",
              isCompact ? "min-w-6 h-6 px-1" : "min-w-8 h-8 px-1.5",
              counterMode === 'experience' 
                ? "bg-yellow-500/40 text-yellow-300" 
                : "bg-black/20 text-white/60"
            )}
          >
            <Sparkles className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            {player.experience > 0 && (
              <span className={isCompact ? "text-[9px]" : "text-[10px]"}>{player.experience}</span>
            )}
          </button>
          
          {/* Energy */}
          <button
            onClick={() => setCounterMode('energy')}
            className={cn(
              "rounded-full transition-all flex items-center justify-center gap-0.5",
              isCompact ? "min-w-6 h-6 px-1" : "min-w-8 h-8 px-1.5",
              counterMode === 'energy' 
                ? "bg-blue-500/40 text-blue-300" 
                : "bg-black/20 text-white/60"
            )}
          >
            <Zap className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            {player.energy > 0 && (
              <span className={isCompact ? "text-[9px]" : "text-[10px]"}>{player.energy}</span>
            )}
          </button>
          
          {/* Commander */}
          <button
            onClick={() => setCounterMode('commander')}
            className={cn(
              "rounded-full transition-all flex items-center justify-center gap-0.5",
              isCompact ? "min-w-6 h-6 px-1" : "min-w-8 h-8 px-1.5",
              counterMode === 'commander' 
                ? "bg-orange-500/40 text-orange-300" 
                : "bg-black/20 text-white/60"
            )}
          >
            <Swords className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            {totalCommanderDamage > 0 && (
              <span className={isCompact ? "text-[9px]" : "text-[10px]"}>{totalCommanderDamage}</span>
            )}
          </button>

          {/* Monarch indicator */}
          {isMonarch && (
            <div className={cn(
              "rounded-full bg-yellow-500/40 flex items-center justify-center",
              isCompact ? "w-6 h-6" : "w-8 h-8"
            )}>
              <Crown className={cn("text-yellow-300", isCompact ? "w-3 h-3" : "w-4 h-4")} fill="currentColor" />
            </div>
          )}

          {/* Initiative indicator */}
          {hasInitiative && (
            <div className={cn(
              "rounded-full bg-purple-500/40 flex items-center justify-center gap-0.5",
              isCompact ? "min-w-6 h-6 px-1" : "min-w-8 h-8 px-1"
            )}>
              <Shield className={cn("text-purple-300", isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} fill="currentColor" />
              <span className={cn("text-purple-300 font-bold", isCompact ? "text-[8px]" : "text-[9px]")}>
                {dungeonProgress + 1}
              </span>
            </div>
          )}
        </div>

        {/* Middle section: Main value + buttons */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
          {counterMode === 'commander' ? (
            /* Commander damage view */
            <div className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-1 overflow-y-auto",
              isCompact ? "px-2 py-1" : "px-3 py-2"
            )}>
              <span className={cn("text-white/50 font-medium", isCompact ? "text-[8px]" : "text-[10px]")}>
                Commander Damage
              </span>
              {opponents.length === 0 ? (
                <span className="text-white/40 text-xs">No opponents</span>
              ) : (
                <div className={cn("w-full grid gap-1", opponents.length > 2 ? "grid-cols-2" : "grid-cols-1")}>
                  {opponents.map((opp) => {
                    const dmg = player.commanderDamage[opp.id] || 0;
                    return (
                      <div 
                        key={opp.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg bg-black/20",
                          isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                        )}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <div 
                            className={cn("rounded-full shrink-0", isCompact ? "w-2 h-2" : "w-2.5 h-2.5")}
                            style={{ backgroundColor: `hsl(${opp.color})` }}
                          />
                          <span className={cn(
                            "text-white/80 truncate",
                            isCompact ? "text-[9px] max-w-[40px]" : "text-[11px] max-w-[60px]"
                          )}>
                            {opp.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onCommanderDamageChange(opp.id, -1)}
                            disabled={!isAdmin}
                            className={cn(
                              "rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20",
                              isCompact ? "w-6 h-6 text-sm" : "w-7 h-7 text-base"
                            )}
                          >−</button>
                          <span className={cn(
                            "font-display text-orange-400 text-center",
                            isCompact ? "text-sm w-4" : "text-base w-5"
                          )}>{dmg}</span>
                          <button
                            onClick={() => onCommanderDamageChange(opp.id, 1)}
                            disabled={!isAdmin}
                            className={cn(
                              "rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20",
                              isCompact ? "w-6 h-6 text-sm" : "w-7 h-7 text-base"
                            )}
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Standard counter/life view */
            <>
              {/* Plus tap zone */}
              {isAdmin && (
                <button
                  onClick={() => handleCounterChange(1)}
                  onPointerDown={() => startHoldToAdjust(1)}
                  onPointerUp={stopHoldToAdjust}
                  onPointerLeave={stopHoldToAdjust}
                  onPointerCancel={stopHoldToAdjust}
                  className="absolute inset-x-0 top-0 h-[40%] flex items-start justify-center pt-2 active:bg-white/5 transition-colors"
                  aria-label="Increase"
                >
                  <span className={cn(
                    "rounded-full bg-black/20 text-white/50 flex items-center justify-center font-medium",
                    isCompact ? "w-8 h-8 text-lg" : "w-10 h-10 text-xl"
                  )}>+</span>
                </button>
              )}

              {/* Value display */}
              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {ModeIcon && (
                  <ModeIcon className={cn(getModeColor(), isCompact ? "w-4 h-4 mb-0.5" : "w-5 h-5 mb-1")} />
                )}
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
                      "text-center bg-black/20 rounded-xl outline-none pointer-events-auto",
                      isCompact ? "w-16 text-[min(12vmin,48px)] px-1" : "w-24 text-[min(16vmin,72px)] px-2"
                    )}
                    style={{ color: 'rgba(0,0,0,0.8)' }}
                    aria-label="Edit value"
                  />
                ) : (
                  <button
                    onClick={handleValueClick}
                    disabled={!isAdmin || counterMode !== 'life'}
                    className={cn(
                      'font-display leading-none transition-transform pointer-events-auto relative',
                      getValueFontSize(),
                      animating && 'animate-life-change',
                      isAdmin && counterMode === 'life' && 'cursor-pointer active:scale-95',
                      counterMode !== 'life' ? getModeColor() : ''
                    )}
                    style={counterMode === 'life' ? { color: 'rgba(0,0,0,0.75)' } : undefined}
                    aria-label={`${counterMode}: ${getCurrentValue()}`}
                  >
                    {getCurrentValue()}
                    {lastDelta !== null && (
                      <span 
                        className={cn(
                          "absolute -right-4 top-1/2 -translate-y-1/2 font-display animate-delta-fade",
                          isCompact ? "text-[min(4vmin,16px)]" : "text-[min(5vmin,20px)]",
                          lastDelta > 0 ? "text-green-900/60" : "text-red-900/60"
                        )}
                      >
                        {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Minus tap zone */}
              {isAdmin && (
                <button
                  onClick={() => handleCounterChange(-1)}
                  onPointerDown={() => startHoldToAdjust(-1)}
                  onPointerUp={stopHoldToAdjust}
                  onPointerLeave={stopHoldToAdjust}
                  onPointerCancel={stopHoldToAdjust}
                  className="absolute inset-x-0 bottom-0 h-[40%] flex items-end justify-center pb-2 active:bg-white/5 transition-colors"
                  aria-label="Decrease"
                >
                  <span className={cn(
                    "rounded-full bg-black/20 text-white/50 flex items-center justify-center font-medium",
                    isCompact ? "w-8 h-8 text-lg" : "w-10 h-10 text-xl"
                  )}>−</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Bottom section: Player name */}
        <div className={cn(
          "flex justify-center items-center shrink-0",
          isCompact ? "pb-1 pt-0.5" : "pb-2 pt-1"
        )}>
          <span 
            className={cn(
              "font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-black/15",
              isCompact ? "text-[8px]" : "text-[10px]"
            )}
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            {player.name}
          </span>
        </div>
      </div>
    </div>
  );
}
