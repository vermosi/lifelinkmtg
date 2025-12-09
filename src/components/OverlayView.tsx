import { useParams } from 'react-router-dom';
import { useRoomState } from '@/hooks/useRoomState';
import { cn } from '@/lib/utils';
import { Skull, Sparkles, Zap, Crown } from 'lucide-react';

export function OverlayView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading } = useRoomState(roomId);

  if (loading || !room) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="font-display text-4xl text-white/30">
          {loading ? 'Loading...' : 'Room not found'}
        </div>
      </div>
    );
  }

  const getFontSize = () => {
    switch (room.settings.overlayFontSize) {
      case 'small': return 'text-5xl';
      case 'large': return 'text-9xl';
      default: return 'text-7xl';
    }
  };

  return (
    <div 
      className="w-screen h-screen flex items-end justify-center p-6"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="flex gap-4">
        {room.players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex flex-col items-center justify-center py-4 px-8 rounded-2xl min-w-[140px] relative',
              room.settings.showBackgroundCards && 'backdrop-blur-md'
            )}
            style={{ 
              backgroundColor: room.settings.showBackgroundCards 
                ? `hsl(${player.color} / 0.85)` 
                : 'transparent' 
            }}
          >
            {/* Monarch crown */}
            {room.monarchId === player.id && (
              <Crown 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-400 drop-shadow-lg" 
                fill="currentColor" 
              />
            )}

            {room.settings.showNamesOnOverlay && (
              <div 
                className="font-body font-semibold text-lg mb-1"
                style={{ color: 'rgba(0,0,0,0.6)' }}
              >
                {player.name}
              </div>
            )}
            <div
              className={cn('font-display leading-none', getFontSize())}
              style={{
                color: room.settings.showBackgroundCards 
                  ? 'rgba(0,0,0,0.7)' 
                  : `hsl(${player.color})`,
                textShadow: room.settings.showBackgroundCards 
                  ? 'none'
                  : `0 0 30px hsl(${player.color} / 0.6), 0 2px 4px rgba(0,0,0,0.5)`,
              }}
            >
              {player.life}
            </div>

            {/* Counters row */}
            <div className="flex gap-2 mt-2">
              {player.poison > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/30">
                  <Skull className="w-3 h-3 text-green-400" />
                  <span className="font-display text-xs text-green-400">{player.poison}</span>
                </div>
              )}
              {player.experience > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/30">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span className="font-display text-xs text-yellow-400">{player.experience}</span>
                </div>
              )}
              {player.energy > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/30">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="font-display text-xs text-blue-400">{player.energy}</span>
                </div>
              )}
            </div>

            {/* Commander damage indicators */}
            {Object.keys(player.commanderDamage).length > 0 && (
              <div className="flex gap-1 mt-1">
                {room.players.filter(p => p.id !== player.id).map(opp => {
                  const dmg = player.commanderDamage[opp.id];
                  if (!dmg) return null;
                  return (
                    <div
                      key={opp.id}
                      className="px-2 py-0.5 rounded text-xs font-display"
                      style={{ 
                        backgroundColor: `hsl(${opp.color} / 0.8)`,
                        color: 'rgba(0,0,0,0.7)',
                      }}
                    >
                      {dmg}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
