import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Loader2, Infinity, Grid3X3 } from 'lucide-react';
import { Room, PlayerCount } from '@/lib/roomUtils';
import { createCloudRoom, getRecentCloudRooms, deleteCloudRoom, removeFromRecentRooms } from '@/lib/cloudRoomUtils';
import { LayoutPicker } from './LayoutPicker';

export function RoomSelector() {
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  useEffect(() => {
    const loadRecentRooms = async () => {
      setIsLoading(true);
      const rooms = await getRecentCloudRooms();
      setRecentRooms(rooms);
      setIsLoading(false);
    };
    loadRecentRooms();
  }, []);

  const handleCreateRoom = async (playerCount: PlayerCount, layoutId: string) => {
    setIsCreating(true);
    setShowLayoutPicker(false);
    const room = await createCloudRoom(playerCount, layoutId);
    if (room) {
      navigate(`/room/${room.id}?adminKey=${room.adminKey}`);
    }
    setIsCreating(false);
  };

  const handleOpenRoom = (roomId: string, adminKey: string) => {
    navigate(`/room/${roomId}?adminKey=${adminKey}`);
  };

  const handleDeleteRoom = async (roomId: string, adminKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this room?')) {
      const success = await deleteCloudRoom(roomId, adminKey);
      if (success) {
        removeFromRecentRooms(roomId);
        setRecentRooms(prev => prev.filter(r => r.id !== roomId));
      }
    }
  };

  if (showLayoutPicker) {
    return (
      <LayoutPicker 
        onSelect={handleCreateRoom}
        onClose={() => setShowLayoutPicker(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-6 sm:space-y-10">
        {/* Logo */}
        <div className="text-center">
          <Infinity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent mb-2 animate-infinity-glow" strokeWidth={1.5} />
          <h1 className="font-display text-4xl sm:text-6xl text-foreground tracking-tight">
            LifeLink
          </h1>
          <p className="text-accent font-medium text-base sm:text-lg mt-1">
            Track. Play. Win.
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 flex items-center justify-center gap-1">
            <Cloud className="w-3 h-3" />
            Cloud Synced Counter & OBS Overlay
          </p>
        </div>

        {/* New Game Button */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => setShowLayoutPicker(true)}
            disabled={isCreating}
            className="w-full py-5 sm:py-6 bg-accent text-accent-foreground rounded-xl sm:rounded-2xl font-display text-2xl sm:text-3xl flex items-center justify-center gap-3 hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
            ) : (
              <Grid3X3 className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
            {isCreating ? 'CREATING...' : 'NEW GAME'}
          </button>
          
          <p className="text-center text-xs text-muted-foreground">
            2-6 players · Partner commanders · Multiple layouts
          </p>
        </div>

        {/* Recent rooms */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4 sm:py-6">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentRooms.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-3 h-3" />
              Recent Games
            </h2>
            <div className="space-y-2">
              {recentRooms.slice(0, 5).map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleOpenRoom(room.id, room.adminKey)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-lg sm:rounded-xl hover:bg-secondary/80 transition-colors group"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="font-display text-xl sm:text-2xl text-foreground">
                      {room.id}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {room.playerCount}P · {room.settings.startingLife}
                      {room.settings.enablePartnerTracking && ' · Partner'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteRoom(room.id, room.adminKey, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs sm:text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OBS tip */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          Rooms sync in real-time across all devices
        </p>
      </div>
    </div>
  );
}
