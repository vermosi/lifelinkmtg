import { useParams } from 'react-router-dom';
import { useRoomState } from '@/hooks/useRoomState';
import { cn } from '@/lib/utils';

export function OverlayView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading } = useRoomState(roomId);

  if (loading || !room) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <div className="font-display text-2xl text-white/50">
          {loading ? 'Loading...' : 'Room not found'}
        </div>
      </div>
    );
  }

  const getLayoutClass = () => {
    switch (room.playerCount) {
      case 2:
        return 'flex-row justify-between';
      case 3:
        return 'flex-row justify-between';
      case 4:
        return 'flex-row justify-between';
      default:
        return 'flex-row justify-between';
    }
  };

  const getFontSize = () => {
    switch (room.settings.overlayFontSize) {
      case 'small':
        return 'text-4xl';
      case 'large':
        return 'text-8xl';
      default:
        return 'text-6xl';
    }
  };

  return (
    <div 
      className="w-screen h-screen bg-transparent flex items-end p-8"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className={cn('w-full flex gap-4', getLayoutClass())}>
        {room.players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl transition-all',
              room.settings.showBackgroundCards && 'bg-black/60 backdrop-blur-sm border border-white/10'
            )}
          >
            {room.settings.showNamesOnOverlay && (
              <div className="font-body font-semibold text-white/80 text-lg mb-1">
                {player.name}
              </div>
            )}
            <div
              className={cn('font-display font-bold', getFontSize())}
              style={{
                color: `hsl(${player.color})`,
                textShadow: `0 0 30px hsl(${player.color} / 0.6), 0 0 60px hsl(${player.color} / 0.4), 0 2px 4px rgba(0,0,0,0.5)`,
              }}
            >
              {player.life}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
