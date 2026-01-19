import { cn } from '@/lib/utils';
import { getTotalCommanderDamageFromPlayer, Player } from '@/lib/roomUtils';

interface CommanderDamageGridProps {
  player: Player;
  opponents: Player[];
  isAdmin: boolean;
  isCompact: boolean;
  onCommanderDamageChange: (fromPlayerId: number, delta: number) => void;
}

export function CommanderDamageGrid({
  player,
  opponents,
  isAdmin,
  isCompact,
  onCommanderDamageChange,
}: CommanderDamageGridProps) {
  return (
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
            const dmg = getTotalCommanderDamageFromPlayer(player, opp.id);
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
                  >
                    −
                  </button>
                  <span className={cn(
                    "font-display text-counter-commander text-center",
                    isCompact ? "text-sm w-4" : "text-base w-5"
                  )}>
                    {dmg}
                  </span>
                  <button
                    onClick={() => onCommanderDamageChange(opp.id, 1)}
                    disabled={!isAdmin}
                    className={cn(
                      "rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20",
                      isCompact ? "w-6 h-6 text-sm" : "w-7 h-7 text-base"
                    )}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
