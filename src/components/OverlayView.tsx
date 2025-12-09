import { useParams } from 'react-router-dom';
import { useRoomState } from '@/hooks/useRoomState';
import { cn } from '@/lib/utils';
import { Skull, Sparkles, Zap, Crown, Shield, Sun, Moon } from 'lucide-react';
import { DUNGEON_ROOMS } from '@/lib/roomUtils';

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
      className="w-screen h-screen flex flex-col items-center justify-end p-6"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Global indicators */}
      <div className="absolute top-4 left-4 flex gap-2">
        {/* Day/Night indicator */}
        <div 
          className={cn(
            'p-2 rounded-full',
            room.isDay ? 'bg-amber-400' : 'bg-indigo-900'
          )}
        >
          {room.isDay ? (
            <Sun className="w-5 h-5 text-amber-900" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-200" />
          )}
        </div>
      </div>

      {/* Initiative dungeon progress */}
      {room.initiativeId && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-purple-400" fill="currentColor" />
          <span className="text-sm text-purple-300 font-medium">
            {DUNGEON_ROOMS[room.dungeonProgress]}
          </span>
          <div className="flex gap-1 ml-2">
            {DUNGEON_ROOMS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-2 h-2 rounded-full',
                  idx <= room.dungeonProgress ? 'bg-purple-500' : 'bg-purple-500/30'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Player cards */}
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
                ? `hsl(${player.color} / 0.9)` 
                : 'transparent' 
            }}
          >
            {/* Status badges */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
              {room.monarchId === player.id && (
                <div className="p-1 rounded-full bg-black/50">
                  <Crown className="w-5 h-5 text-yellow-400" fill="currentColor" />
                </div>
              )}
              {room.initiativeId === player.id && (
                <div className="p-1 rounded-full bg-black/50">
                  <Shield className="w-5 h-5 text-purple-400" fill="currentColor" />
                </div>
              )}
            </div>

            {room.settings.showNamesOnOverlay && (
              <div 
                className="font-body font-semibold text-lg mb-1"
                style={{ color: 'rgba(0,0,0,0.7)' }}
              >
                {player.name}
              </div>
            )}
            <div
              className={cn('font-display leading-none', getFontSize())}
              style={{
                color: room.settings.showBackgroundCards 
                  ? 'rgba(0,0,0,0.8)' 
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
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40">
                  <Skull className="w-3 h-3 text-green-400" />
                  <span className="font-display text-xs text-green-400 font-bold">{player.poison}</span>
                </div>
              )}
              {player.experience > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span className="font-display text-xs text-yellow-400 font-bold">{player.experience}</span>
                </div>
              )}
              {player.energy > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="font-display text-xs text-blue-400 font-bold">{player.energy}</span>
                </div>
              )}
            </div>

            {/* Commander damage */}
            {Object.keys(player.commanderDamage).length > 0 && (
              <div className="flex gap-1 mt-1">
                {room.players.filter(p => p.id !== player.id).map(opp => {
                  const dmg = player.commanderDamage[opp.id];
                  if (!dmg) return null;
                  return (
                    <div
                      key={opp.id}
                      className="px-2 py-0.5 rounded text-xs font-display font-bold"
                      style={{ 
                        backgroundColor: `hsl(${opp.color})`,
                        color: 'rgba(0,0,0,0.8)',
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
