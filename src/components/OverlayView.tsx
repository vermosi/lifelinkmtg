import { useParams } from 'react-router-dom';
import { useRoomState } from '@/hooks/useRoomState';
import { cn } from '@/lib/utils';

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
      case 'small':
        return 'text-5xl';
      case 'large':
        return 'text-9xl';
      default:
        return 'text-7xl';
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
              'flex flex-col items-center justify-center py-4 px-8 rounded-2xl min-w-[140px]',
              room.settings.showBackgroundCards && 'backdrop-blur-md'
            )}
            style={{ 
              backgroundColor: room.settings.showBackgroundCards 
                ? `hsl(${player.color} / 0.85)` 
                : 'transparent' 
            }}
          >
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
          </div>
        ))}
      </div>
    </div>
  );
}
