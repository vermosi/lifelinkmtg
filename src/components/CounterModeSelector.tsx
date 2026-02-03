import { cn } from '@/lib/utils';
import { Crown, Shield, Skull, Sparkles, Zap, Swords } from 'lucide-react';
import type { CounterMode } from '@/hooks/useCounterMode';

interface CounterModeSelectorProps {
  mode: CounterMode;
  onModeChange: (mode: CounterMode) => void;
  poison: number;
  experience: number;
  energy: number;
  commanderDamage: number;
  isMonarch: boolean;
  hasInitiative: boolean;
  dungeonProgress: number;
  isCompact: boolean;
  isAdmin: boolean;
  onToggleMonarch: () => void;
  onToggleInitiative: () => void;
}

export function CounterModeSelector({
  mode,
  onModeChange,
  poison,
  experience,
  energy,
  commanderDamage,
  isMonarch,
  hasInitiative,
  dungeonProgress,
  isCompact,
  isAdmin,
  onToggleMonarch,
  onToggleInitiative,
}: CounterModeSelectorProps) {
  const btnBase = cn(
    "rounded-full transition-all flex items-center justify-center",
    isCompact ? "h-6" : "h-8"
  );
  
  const iconSize = isCompact ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = isCompact ? "text-[9px]" : "text-[10px]";

  return (
    <div className={cn(
      "flex justify-center items-center gap-1 shrink-0 flex-wrap",
      isCompact ? "pt-1 pb-0.5 px-1" : "pt-2 pb-1 px-2"
    )}>
      {/* Life */}
      <button
        onClick={() => onModeChange('life')}
        className={cn(
          btnBase,
          isCompact ? "w-6 text-[9px]" : "w-8 text-[10px]",
          mode === 'life' 
            ? "bg-black/40 text-white font-bold" 
            : "bg-black/20 text-white/60"
        )}
      >
        ♥
      </button>

      {/* Poison */}
      <button
        onClick={() => onModeChange('poison')}
        className={cn(
          btnBase, "gap-0.5",
          isCompact ? "min-w-6 px-1" : "min-w-8 px-1.5",
          mode === 'poison' 
            ? "bg-counter-poison/40 text-counter-poison" 
            : "bg-black/20 text-white/60"
        )}
      >
        <Skull className={iconSize} />
        {poison > 0 && <span className={textSize}>{poison}</span>}
      </button>

      {/* Experience */}
      <button
        onClick={() => onModeChange('experience')}
        className={cn(
          btnBase, "gap-0.5",
          isCompact ? "min-w-6 px-1" : "min-w-8 px-1.5",
          mode === 'experience' 
            ? "bg-counter-experience/40 text-counter-experience" 
            : "bg-black/20 text-white/60"
        )}
      >
        <Sparkles className={iconSize} />
        {experience > 0 && <span className={textSize}>{experience}</span>}
      </button>

      {/* Energy */}
      <button
        onClick={() => onModeChange('energy')}
        className={cn(
          btnBase, "gap-0.5",
          isCompact ? "min-w-6 px-1" : "min-w-8 px-1.5",
          mode === 'energy' 
            ? "bg-counter-energy/40 text-counter-energy" 
            : "bg-black/20 text-white/60"
        )}
      >
        <Zap className={iconSize} />
        {energy > 0 && <span className={textSize}>{energy}</span>}
      </button>

      {/* Commander */}
      <button
        onClick={() => onModeChange('commander')}
        className={cn(
          btnBase, "gap-0.5",
          isCompact ? "min-w-6 px-1" : "min-w-8 px-1.5",
          mode === 'commander' 
            ? "bg-counter-commander/40 text-counter-commander" 
            : "bg-black/20 text-white/60"
        )}
      >
        <Swords className={iconSize} />
        {commanderDamage > 0 && <span className={textSize}>{commanderDamage}</span>}
      </button>

      {/* Monarch toggle */}
      <button
        onClick={isAdmin ? onToggleMonarch : undefined}
        disabled={!isAdmin}
        className={cn(
          btnBase,
          isCompact ? "w-6" : "w-8",
          isMonarch
            ? "bg-counter-monarch/40 text-counter-monarch"
            : "bg-black/20 text-white/40",
          isAdmin && "cursor-pointer hover:bg-black/30",
          !isAdmin && "cursor-default"
        )}
        aria-label={isMonarch ? "Remove Monarch" : "Claim Monarch"}
      >
        <Crown
          className={cn(isCompact ? "w-3 h-3" : "w-4 h-4")}
          fill={isMonarch ? "currentColor" : "none"}
        />
      </button>

      {/* Initiative toggle */}
      <button
        onClick={isAdmin ? onToggleInitiative : undefined}
        disabled={!isAdmin}
        className={cn(
          btnBase, "gap-0.5",
          isCompact ? "min-w-6 px-1" : "min-w-8 px-1",
          hasInitiative
            ? "bg-counter-initiative/40 text-counter-initiative"
            : "bg-black/20 text-white/40",
          isAdmin && "cursor-pointer hover:bg-black/30",
          !isAdmin && "cursor-default"
        )}
        aria-label={hasInitiative ? "Remove Initiative" : "Claim Initiative"}
      >
        <Shield
          className={cn(isCompact ? "w-3 h-3" : "w-3.5 h-3.5")}
          fill={hasInitiative ? "currentColor" : "none"}
        />
        {hasInitiative && (
          <span className={cn("font-bold", isCompact ? "text-[8px]" : "text-[9px]")}>
            {dungeonProgress + 1}
          </span>
        )}
      </button>
    </div>
  );
}
