import { cn } from '@/lib/utils';
import { Skull, Sparkles, Zap, Swords } from 'lucide-react';
import type { CounterMode } from '@/hooks/useCounterMode';

interface CounterValueDisplayProps {
  mode: CounterMode;
  value: number;
  isCompact: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onValueClick: () => void;
  isAdmin: boolean;
  animating: boolean;
  lastDelta: number | null;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MODE_ICONS = {
  poison: Skull,
  experience: Sparkles,
  energy: Zap,
  commander: Swords,
  life: null,
} as const;

const MODE_COLORS = {
  poison: 'text-counter-poison',
  experience: 'text-counter-experience',
  energy: 'text-counter-energy',
  commander: 'text-counter-commander',
  life: '',
} as const;

export function CounterValueDisplay({
  mode,
  value,
  isCompact,
  isEditing,
  editValue,
  onEditValueChange,
  onEditSubmit,
  onEditCancel,
  onValueClick,
  isAdmin,
  animating,
  lastDelta,
  inputRef,
}: CounterValueDisplayProps) {
  const ModeIcon = MODE_ICONS[mode];
  const modeColor = MODE_COLORS[mode];

  const getValueFontSize = () => {
    const digits = Math.abs(value).toString().length + (value < 0 ? 1 : 0);
    
    if (mode !== 'life') {
      return isCompact ? 'text-[min(14vmin,56px)]' : 'text-[min(18vmin,72px)]';
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

  return (
    <div className="relative z-10 flex flex-col items-center pointer-events-none">
      {ModeIcon && (
        <ModeIcon className={cn(modeColor, isCompact ? "w-4 h-4 mb-0.5" : "w-5 h-5 mb-1")} />
      )}
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
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
          onClick={onValueClick}
          disabled={!isAdmin || mode !== 'life'}
          className={cn(
            'font-display leading-none transition-transform pointer-events-auto relative',
            getValueFontSize(),
            animating && 'animate-life-change',
            isAdmin && mode === 'life' && 'cursor-pointer active:scale-95',
            mode !== 'life' ? modeColor : ''
          )}
          style={mode === 'life' ? { color: 'rgba(0,0,0,0.75)' } : undefined}
          aria-label={`${mode}: ${value}`}
        >
          {value}
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
  );
}
