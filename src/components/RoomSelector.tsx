import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Monitor, Trash2, Users } from 'lucide-react';
import { Room, RoomsState, loadRoomsState, createRoom, saveRoom, deleteRoom, getControlUrl, getOverlayUrl } from '@/lib/roomUtils';
import { Button } from '@/components/ui/button';
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

  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this room?')) {
      deleteRoom(roomId);
      setRoomsState(loadRoomsState());
    }
  };

  const handleOpenControl = (room: Room) => {
    navigate(`/room/${room.id}?adminKey=${room.adminKey}`);
  };

  const handleCopyOverlay = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getOverlayUrl(room));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground glow-primary">
            LIFE TRACKER
          </h1>
          <p className="text-muted-foreground">
            Track life totals & stream to OBS
          </p>
        </div>

        {/* Create new room */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">New Game</h2>
          
          {/* Player count selector */}
          <div className="flex gap-2">
            {([2, 3, 4] as const).map((count) => (
              <button
                key={count}
                onClick={() => setSelectedPlayerCount(count)}
                className={cn(
                  'flex-1 py-3 rounded-lg font-display font-semibold transition-all flex items-center justify-center gap-2',
                  selectedPlayerCount === count
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="w-4 h-4" />
                {count}
              </button>
            ))}
          </div>

          <Button
            onClick={handleCreateRoom}
            className="w-full h-14 text-lg font-display font-semibold gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Room
          </Button>
        </div>

        {/* Recent rooms */}
        {recentRooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Rooms</h2>
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => handleOpenControl(room)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-foreground">
                      Room {room.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {room.playerCount} players · {room.settings.startingLife} life
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleCopyOverlay(room, e)}
                      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Overlay URL"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRoom(room.id, e)}
                      className="p-2 rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OBS Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p className="font-medium">OBS Setup</p>
          <p>Add Browser Source → paste Overlay URL → set 1920×1080</p>
        </div>
      </div>
    </div>
  );
}
