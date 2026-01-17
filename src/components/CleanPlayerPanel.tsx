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
  const getLifeFontSize = () => {
    const digits = Math.abs(player.life).toString().length + (player.life < 0 ? 1 : 0);
    if (isCompact) {
      if (digits <= 2) return 'text-[20vmin]';
      if (digits <= 3) return 'text-[16vmin]';
      return 'text-[12vmin]';
    }
    if (digits <= 2) return 'text-[28vmin]';
    if (digits <= 3) return 'text-[22vmin]';
    return 'text-[16vmin]';
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

        {/* Plus button - top */}
        {isAdmin && (
          <button
            onClick={() => handleLifeChange(1)}
            onPointerDown={() => startHoldToAdjust(1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className={cn(
              "life-btn life-btn-plus",
              isCompact ? "top-[12%]" : "top-[10%]"
            )}
            aria-label="Increase life"
          >
            <span className="life-btn-icon">+</span>
          </button>
        )}

        {/* Life total - center */}
        <div className="relative flex items-center justify-center">
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
                "life-input font-display text-center bg-black/20 rounded-2xl outline-none",
                isCompact ? "w-24 text-[16vmin] px-2 py-1" : "w-40 text-[24vmin] px-4 py-2"
              )}
              style={{ color: 'rgba(0,0,0,0.8)' }}
            />
          ) : (
            <button
              onClick={handleLifeClick}
              disabled={!isAdmin}
              className={cn(
                "life-total font-display leading-none transition-all relative",
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
                    "absolute -right-8 top-1/2 -translate-y-1/2 font-display text-[6vmin] animate-delta-fade",
                    lastDelta > 0 ? "text-green-900/60" : "text-red-900/60"
                  )}
                >
                  {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Player name - below life */}
        <div className={cn(
          "absolute text-center",
          isCompact ? "bottom-[20%]" : "bottom-[18%]"
        )}>
          <span 
            className={cn(
              "font-medium tracking-wide uppercase",
              isCompact ? "text-xs" : "text-sm"
            )}
            style={{ color: 'rgba(0,0,0,0.5)' }}
          >
            {player.name}
          </span>
        </div>

        {/* Minus button - bottom */}
        {isAdmin && (
          <button
            onClick={() => handleLifeChange(-1)}
            onPointerDown={() => startHoldToAdjust(-1)}
            onPointerUp={stopHoldToAdjust}
            onPointerLeave={stopHoldToAdjust}
            onPointerCancel={stopHoldToAdjust}
            className={cn(
              "life-btn life-btn-minus",
              isCompact ? "bottom-[12%]" : "bottom-[10%]"
            )}
            aria-label="Decrease life"
          >
            <span className="life-btn-icon">−</span>
          </button>
        )}

        {/* Counter indicators - bottom left */}
        {(player.poison > 0 || player.experience > 0 || player.energy > 0) && (
          <button
            onClick={onOpenCounters}
            disabled={!isAdmin}
            className={cn(
              "absolute flex gap-1 rounded-lg bg-black/30 backdrop-blur-sm",
              isCompact ? "bottom-3 left-2 px-1.5 py-1" : "bottom-4 left-3 px-2 py-1.5",
              isAdmin && "cursor-pointer hover:bg-black/40"
            )}
          >
            {player.poison > 0 && (
              <span className={cn("font-display text-green-300", isCompact ? "text-xs" : "text-sm")}>
                ☠️ {player.poison}
              </span>
            )}
            {player.experience > 0 && (
              <span className={cn("font-display text-yellow-300", isCompact ? "text-xs" : "text-sm")}>
                ✨ {player.experience}
              </span>
            )}
            {player.energy > 0 && (
              <span className={cn("font-display text-blue-300", isCompact ? "text-xs" : "text-sm")}>
                ⚡ {player.energy}
              </span>
            )}
          </button>
        )}

        {/* Commander damage indicators - bottom right */}
        {Object.keys(player.commanderDamage).length > 0 && (
          <button
            onClick={onOpenCounters}
            disabled={!isAdmin}
            className={cn(
              "absolute flex gap-1 rounded-lg bg-black/30 backdrop-blur-sm",
              isCompact ? "bottom-3 right-2 px-1.5 py-1" : "bottom-4 right-3 px-2 py-1.5",
              isAdmin && "cursor-pointer hover:bg-black/40"
            )}
          >
            {Object.entries(player.commanderDamage).map(([oppId, dmg]) => {
              if (!dmg) return null;
              return (
                <span 
                  key={oppId} 
                  className={cn("font-display", isCompact ? "text-xs" : "text-sm")}
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  ⚔️ {dmg}
                </span>
              );
            })}
          </button>
        )}
      </div>
    </div>
  );
}
