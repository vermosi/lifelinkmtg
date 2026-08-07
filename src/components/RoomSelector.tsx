import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Loader2, Infinity, Grid3X3, LogIn, Monitor, Users, RefreshCw, Smartphone } from 'lucide-react';
import { Room, PlayerCount } from '@/lib/roomUtils';
import { createCloudRoom, getCloudRoom, getRecentCloudRooms, getStoredAdminKey, deleteCloudRoom, removeFromRecentRooms } from '@/lib/cloudRoomUtils';
import { LayoutPicker } from './LayoutPicker';
import { toast } from '@/hooks/use-toast';

export function RoomSelector() {
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    if (!/^[A-Za-z0-9]{4,32}$/.test(code)) {
      toast({ title: 'Invalid code', description: 'Codes are 4-32 letters and numbers.' });
      return;
    }
    setIsJoining(true);
    const room = await getCloudRoom(code);
    setIsJoining(false);
    if (!room) {
      toast({ title: 'Room not found', description: `No active room matches “${code}”.` });
      return;
    }
    const storedAdminKey = getStoredAdminKey(room.id);
    if (storedAdminKey) {
      navigate(`/room/${room.id}?adminKey=${storedAdminKey}`);
    } else {
      navigate(`/room/${room.id}`);
    }
  };

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
    <div className="min-h-screen w-full bg-background flex flex-col items-center p-4 sm:p-8 lg:p-12">
      {/* Soft ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl flex flex-col items-center py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-4">
            <Cloud className="w-3 h-3" />
            Cloud Synced Counter & OBS Overlay
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-foreground tracking-tight mb-4">
            LifeLink
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
            Track. Play. Win.
          </p>
        </div>

        {/* Main actions — glass panel */}
        <div className="w-full max-w-2xl bg-card/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
            <button
              onClick={() => setShowLayoutPicker(true)}
              disabled={isCreating}
              className="flex-[1.5] py-2.5 sm:py-4 px-4 sm:px-5 bg-accent text-accent-foreground rounded-2xl font-display text-base sm:text-lg lg:text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              {isCreating ? 'CREATING...' : 'NEW GAME'}
            </button>

            <form onSubmit={handleJoinByCode} className="flex-1 relative group">
              <label htmlFor="join-code" className="sr-only">
                Join with code
              </label>
              <input
                id="join-code"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                placeholder="Join with code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, ''))}
                aria-label="Room join code"
                className="w-full h-full py-2.5 sm:py-3 px-4 sm:px-5 pr-[4.5rem] bg-secondary/50 border-2 border-transparent focus:border-accent focus:bg-secondary rounded-2xl outline-none transition-all text-foreground font-display text-sm sm:text-base lg:text-lg tracking-wider text-center placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-body"
              />
              <button
                type="submit"
                disabled={isJoining || joinCode.trim().length < 4}
                className="absolute right-2 top-2 bottom-2 px-3 sm:px-4 bg-card text-accent font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 text-sm"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JOIN'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3 sm:mt-4">
            2-6 players · Partner commanders · Multiple layouts
          </p>
        </div>

        {/* Recent rooms */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentRooms.length > 0 && (
          <div className="w-full max-w-2xl mb-10 sm:mb-12">
            <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Cloud className="w-3 h-3" />
              Recent Games
            </h2>
            <div className="space-y-2">
              {recentRooms.slice(0, 5).map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleOpenRoom(room.id, room.adminKey)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-secondary/60 rounded-xl hover:bg-secondary transition-colors group"
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

        {/* Feature highlights */}
        <section aria-label="Features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 w-full mb-4">
          <div className="group p-4 sm:p-6 rounded-2xl transition-all hover:bg-card/50">
            <div className="w-12 h-12 bg-card shadow-sm rounded-xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="font-bold text-foreground mb-2">Real-time sync</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every phone, tablet, and PC in the room stays in sync as life totals change.
            </p>
          </div>

          <div className="group p-4 sm:p-6 rounded-2xl transition-all hover:bg-card/50">
            <div className="w-12 h-12 bg-card shadow-sm rounded-xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="font-bold text-foreground mb-2">OBS overlay</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drop the read-only overlay into OBS or Twitch as a Browser Source and stream life totals instantly.
            </p>
          </div>

          <div className="group p-4 sm:p-6 rounded-2xl transition-all hover:bg-card/50">
            <div className="w-12 h-12 bg-card shadow-sm rounded-xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="font-bold text-foreground mb-2">Mobile-first</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Big tap targets, no install required, and optimized for phones at the table.
            </p>
          </div>
        </section>

        <footer className="mt-8 sm:mt-14 pt-6 border-t border-border w-full text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Supports 2–6 players, Commander damage, poison, energy, and more.
          </p>
        </footer>
      </div>
    </div>
  );
}
