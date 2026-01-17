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
  );
}
