import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { RoomsState, loadRoomsState, createRoom, saveRoom, deleteRoom } from '@/lib/roomUtils';
import { cn } from '@/lib/utils';

export function RoomSelector() {
  const navigate = useNavigate();
  const [roomsState, setRoomsState] = useState<RoomsState>(loadRoomsState);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<2 | 3 | 4>(4);

  const recentRooms = roomsState.recentRoomIds
    .map(id => roomsState.rooms[id])
    .filter(Boolean);

  const handleCreateRoom = () => {
    const room = createRoom(selectedPlayerCount);
    saveRoom(room);
    setRoomsState(loadRoomsState());
    navigate(`/room/${room.id}?adminKey=${room.adminKey}`);
  };

  const handleOpenRoom = (roomId: string, adminKey: string) => {
    navigate(`/room/${roomId}?adminKey=${adminKey}`);
  };

  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this room?')) {
      deleteRoom(roomId);
      setRoomsState(loadRoomsState());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display text-7xl text-foreground tracking-tight">
            LIFE
          </h1>
          <p className="text-muted-foreground text-lg -mt-2">
            Counter & OBS Overlay
          </p>
        </div>

        {/* Player count selector */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {([2, 3, 4] as const).map((count) => (
              <button
                key={count}
                onClick={() => setSelectedPlayerCount(count)}
                className={cn(
                  'flex-1 py-6 rounded-2xl font-display text-4xl transition-all flex flex-col items-center gap-1',
                  selectedPlayerCount === count
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="w-6 h-6" />
                {count}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full py-5 bg-accent text-accent-foreground rounded-2xl font-display text-3xl flex items-center justify-center gap-3 hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-7 h-7" />
            NEW GAME
          </button>
        </div>

        {/* Recent rooms */}
        {recentRooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Games
            </h2>
            <div className="space-y-2">
              {recentRooms.slice(0, 5).map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleOpenRoom(room.id, room.adminKey)}
                  className="w-full flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-display text-2xl text-foreground">
                      {room.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {room.playerCount}P · {room.settings.startingLife}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteRoom(room.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-sm"
                  >
                    Delete
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OBS tip */}
        <p className="text-center text-sm text-muted-foreground">
          Add overlay URL to OBS as Browser Source
        </p>
      </div>
    </div>
  );
}
