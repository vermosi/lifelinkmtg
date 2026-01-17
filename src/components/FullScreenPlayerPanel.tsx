import { useState, useEffect, useRef } from 'react';
import { Player } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCounterMode } from '@/hooks/useCounterMode';
import { useHoldToAdjust } from '@/hooks/useHoldToAdjust';
import { CounterModeSelector } from './CounterModeSelector';
import { CommanderDamageGrid } from './CommanderDamageGrid';
import { CounterValueDisplay } from './CounterValueDisplay';

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
  enableHoldToAdjust: holdEnabled,
  onSelect,
}: FullScreenPlayerPanelProps) {
  const isCompact = playerCount >= 3;
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(player.life.toString());
  const [isFocused, setIsFocused] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opponents = allPlayers.filter(p => p.id !== player.id);

  const {
    mode,
    setMode,
    currentValue,
    totalCommanderDamage,
    handleChange,
    animating,
    lastDelta,
  } = useCounterMode({
    player,
    isAdmin,
    onLifeChange,
    onPoisonChange,
    onExperienceChange,
    onEnergyChange,
  });

  const holdToAdjust = useHoldToAdjust({
    enabled: isAdmin && holdEnabled,
    onAdjust: (delta) => handleChange(delta, true),
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleValueClick = () => {
    if (!isAdmin || mode !== 'life') return;
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
      {/* Rotated content container */}
      <div
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Top section: Counter mode selector */}
        <CounterModeSelector
          mode={mode}
          onModeChange={setMode}
          poison={player.poison}
          experience={player.experience}
          energy={player.energy}
          commanderDamage={totalCommanderDamage}
          isMonarch={isMonarch}
          hasInitiative={hasInitiative}
          dungeonProgress={dungeonProgress}
          isCompact={isCompact}
        />

        {/* Middle section: Main value + buttons */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
          {mode === 'commander' ? (
            <CommanderDamageGrid
              player={player}
              opponents={opponents}
              isAdmin={isAdmin}
              isCompact={isCompact}
              onCommanderDamageChange={onCommanderDamageChange}
            />
          ) : (
            <>
              {/* Plus tap zone */}
              {isAdmin && (
                <button
                  onClick={() => handleChange(1)}
                  onPointerDown={() => holdToAdjust.start(1)}
                  onPointerUp={holdToAdjust.stop}
                  onPointerLeave={holdToAdjust.stop}
                  onPointerCancel={holdToAdjust.stop}
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
              <CounterValueDisplay
                mode={mode}
                value={currentValue}
                isCompact={isCompact}
                isEditing={isEditing}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => setIsEditing(false)}
                onValueClick={handleValueClick}
                isAdmin={isAdmin}
                animating={animating}
                lastDelta={lastDelta}
                inputRef={inputRef as React.RefObject<HTMLInputElement>}
              />

              {/* Minus tap zone */}
              {isAdmin && (
                <button
                  onClick={() => handleChange(-1)}
                  onPointerDown={() => holdToAdjust.start(-1)}
                  onPointerUp={holdToAdjust.stop}
                  onPointerLeave={holdToAdjust.stop}
                  onPointerCancel={holdToAdjust.stop}
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

        {/* Bottom: Player name */}
        <div className={cn(
          "shrink-0 text-center",
          isCompact ? "pb-1 px-1" : "pb-2 px-2"
        )}>
          <span className={cn(
            "font-medium text-black/60 truncate block",
            isCompact ? "text-[10px]" : "text-xs"
          )}>
            {player.name}
          </span>
          {player.deckName && (
            <span className={cn(
              "text-black/40 truncate block",
              isCompact ? "text-[8px]" : "text-[10px]"
            )}>
              {player.deckName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
