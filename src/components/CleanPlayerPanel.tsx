import { useState, useEffect, useRef, useCallback } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Crown, Shield } from 'lucide-react';

interface CleanPlayerPanelProps {
  player: Player;
  playerCount: number;
  isMonarch: boolean;
  hasInitiative: boolean;
  onLifeChange: (delta: number) => void;
  onLifeSet: (life: number) => void;
  isAdmin: boolean;
  rotation: number;
  enableHoldToAdjust: boolean;
  onOpenCounters: () => void;
}

export function CleanPlayerPanel({
  player,
  playerCount,
  isMonarch,
  hasInitiative,
  onLifeChange,
  onLifeSet,
  isAdmin,
  rotation,
  enableHoldToAdjust,
  onOpenCounters,
}: CleanPlayerPanelProps) {
  const isCompact = playerCount >= 3;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [animating, setAnimating] = useState(false);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLifeActionRef = useRef(0);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => stopHoldToAdjust();
  }, []);

  const handleLifeChange = useCallback((delta: number, fromHold = false) => {
    if (!isAdmin) return;
    if (!fromHold) {
      const now = Date.now();
      if (now - lastLifeActionRef.current < 100) return;
      lastLifeActionRef.current = now;
    }
    haptics.light();
    onLifeChange(delta);
    setLastDelta(delta);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      setLastDelta(null);
    }, 300);
  }, [isAdmin, onLifeChange]);

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
      let speed = 150;
      let count = 0;
      holdIntervalRef.current = setInterval(() => {
        handleLifeChange(delta, true);
        count++;
        // Accelerate after 5 taps
        if (count === 5 && speed > 80) {
          clearInterval(holdIntervalRef.current!);
          speed = 80;
          holdIntervalRef.current = setInterval(() => handleLifeChange(delta, true), speed);
        }
      }, speed);
    }, 250);
  };

  const handleLongPress = useCallback(() => {
    if (isAdmin) {
      haptics.medium();
      onOpenCounters();
    }
  }, [isAdmin, onOpenCounters]);

  // Calculate dynamic font size based on life total digits and player count
  // Mobile-first: use smaller base sizes that work on 5" screens
  const getLifeFontSize = () => {
    const digits = Math.abs(player.life).toString().length + (player.life < 0 ? 1 : 0);
    if (isCompact) {
      // 3-4 players: smaller panels
      if (digits <= 2) return 'text-[min(18vmin,80px)]';
      if (digits <= 3) return 'text-[min(14vmin,60px)]';
      return 'text-[min(10vmin,48px)]';
    }
    // 1-2 players: larger panels
    if (digits <= 2) return 'text-[min(24vmin,120px)]';
    if (digits <= 3) return 'text-[min(18vmin,90px)]';
    return 'text-[min(14vmin,72px)]';
  };

  return (
    <div
      className="player-panel w-full h-full relative select-none"
      style={{ backgroundColor: `hsl(${player.color})` }}
    >
      {/* Rotated content wrapper */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Status badges */}
        {(isMonarch || hasInitiative) && (
          <div className={cn(
            "absolute flex gap-1.5 z-10",
            isCompact ? "top-2" : "top-4"
          )}>
            {isMonarch && (
              <div className={cn(
                "rounded-full bg-black/30 backdrop-blur-sm shadow-lg",
                isCompact ? "p-1" : "p-2"
              )}>
                <Crown 
                  className={cn("text-yellow-300", isCompact ? "w-4 h-4" : "w-6 h-6")} 
                  fill="currentColor" 
                />
              </div>
            )}
            {hasInitiative && (
              <div className={cn(
                "rounded-full bg-black/30 backdrop-blur-sm shadow-lg",
                isCompact ? "p-1" : "p-2"
              )}>
                <Shield 
                  className={cn("text-purple-300", isCompact ? "w-4 h-4" : "w-6 h-6")} 
                  fill="currentColor" 
                />
              </div>
            )}
          </div>
        )}

        {/* Plus button - top half tap zone */}
        {isAdmin && (
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
              isCompact ? "w-10 h-10 text-xl" : "w-12 h-12 text-2xl"
            )}>+</span>
          </button>
        )}

        {/* Life total - center (tap to edit) */}
        <div className="relative flex items-center justify-center z-20 pointer-events-none">
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
                "life-input font-display text-center bg-black/20 rounded-2xl outline-none pointer-events-auto",
                isCompact ? "w-20 text-[min(14vmin,56px)] px-2 py-1" : "w-32 text-[min(20vmin,96px)] px-3 py-2"
              )}
              style={{ color: 'rgba(0,0,0,0.8)' }}
            />
          ) : (
            <button
              onClick={handleLifeClick}
              disabled={!isAdmin}
              className={cn(
                "life-total font-display leading-none transition-all relative pointer-events-auto",
                getLifeFontSize(),
                animating && "animate-life-change",
                isAdmin && "cursor-pointer active:scale-95"
              )}
              style={{ color: 'rgba(0,0,0,0.75)' }}
              aria-label={`Life: ${player.life}. Tap to edit.`}
            >
              {player.life}
              
              {/* Delta indicator */}
              {lastDelta !== null && (
                <span 
                  className={cn(
                    "absolute -right-6 top-1/2 -translate-y-1/2 font-display animate-delta-fade",
                    isCompact ? "text-[min(5vmin,20px)]" : "text-[min(6vmin,28px)]",
                    lastDelta > 0 ? "text-green-900/60" : "text-red-900/60"
                  )}
                >
                  {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Player name - fixed position at bottom */}
        <div className={cn(
          "absolute left-0 right-0 text-center z-10",
          isCompact ? "bottom-2" : "bottom-3"
        )}>
          <span 
            className={cn(
              "font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-black/10",
              isCompact ? "text-[10px]" : "text-xs"
            )}
            style={{ color: 'rgba(0,0,0,0.6)' }}
          >
            {player.name}
          </span>
        </div>

        {/* Minus button - bottom half tap zone */}
        {isAdmin && (
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
              isCompact ? "w-10 h-10 text-xl" : "w-12 h-12 text-2xl"
            )}>−</span>
          </button>
        )}

        {/* Counter indicators - top left, always visible */}
        {(player.poison > 0 || player.experience > 0 || player.energy > 0) && (
          <button
            onClick={onOpenCounters}
            disabled={!isAdmin}
            className={cn(
              "absolute z-30 flex gap-1 rounded-md bg-black/40 backdrop-blur-sm",
              isCompact ? "top-1 left-1 px-1 py-0.5" : "top-2 left-2 px-1.5 py-1",
              isAdmin && "active:bg-black/50"
            )}
          >
            {player.poison > 0 && (
              <span className={cn("font-display text-green-300", isCompact ? "text-[10px]" : "text-xs")}>
                ☠️{player.poison}
              </span>
            )}
            {player.experience > 0 && (
              <span className={cn("font-display text-yellow-300", isCompact ? "text-[10px]" : "text-xs")}>
                ✨{player.experience}
              </span>
            )}
            {player.energy > 0 && (
              <span className={cn("font-display text-blue-300", isCompact ? "text-[10px]" : "text-xs")}>
                ⚡{player.energy}
              </span>
            )}
          </button>
        )}

        {/* Commander damage indicators - top right */}
        {Object.values(player.commanderDamage).some(d => d > 0) && (
          <button
            onClick={onOpenCounters}
            disabled={!isAdmin}
            className={cn(
              "absolute z-30 flex gap-1 rounded-md bg-black/40 backdrop-blur-sm",
              isCompact ? "top-1 right-1 px-1 py-0.5" : "top-2 right-2 px-1.5 py-1",
              isAdmin && "active:bg-black/50"
            )}
          >
            <span 
              className={cn("font-display text-orange-300", isCompact ? "text-[10px]" : "text-xs")}
            >
              ⚔️{Object.values(player.commanderDamage).reduce((a, b) => a + b, 0)}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
