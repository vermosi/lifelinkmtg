import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, RotateCcw, Users, Heart, Copy, Check, Monitor, ArrowLeft, Shuffle, Settings2 } from 'lucide-react';
import { useRoomState } from '@/hooks/useRoomState';
import { getControlUrl, getOverlayUrl } from '@/lib/roomUtils';
import { FullScreenPlayerPanel } from './FullScreenPlayerPanel';
import { cn } from '@/lib/utils';

export function RoomControl() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adminKey = searchParams.get('adminKey');

  const {
    room,
    loading,
    updatePlayerLife,
    setPlayerLife,
    setPlayerName,
    resetGame,
    setPlayerCount,
    setStartingLife,
  } = useRoomState(roomId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<'control' | 'overlay' | null>(null);
  const [highlightedPlayer, setHighlightedPlayer] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="font-display text-4xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="font-display text-4xl text-foreground">Room not found</div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-secondary rounded-full text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    );
  }

  const isAdmin = adminKey === room.adminKey;

  const copyUrl = (type: 'control' | 'overlay') => {
    const url = type === 'control' ? getControlUrl(room) : getOverlayUrl(room);
    navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const randomizeFirstPlayer = () => {
    const randomIndex = Math.floor(Math.random() * room.playerCount);
    setHighlightedPlayer(room.players[randomIndex].id);
    setTimeout(() => setHighlightedPlayer(null), 3000);
    setMenuOpen(false);
  };

  // Get rotation and position for each player based on count
  const getPlayerLayout = (index: number, total: number) => {
    if (total === 2) {
      return {
        rotation: index === 0 ? 180 : 0,
        gridArea: index === 0 ? 'top' : 'bottom',
      };
    }
    if (total === 3) {
      if (index === 0) return { rotation: 180, gridArea: 'top-left' };
      if (index === 1) return { rotation: 180, gridArea: 'top-right' };
      return { rotation: 0, gridArea: 'bottom' };
    }
    // 4 players
    const rotations = [180, 180, 0, 0];
    const areas = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    return { rotation: rotations[index], gridArea: areas[index] };
  };

  const getGridStyle = () => {
    if (room.playerCount === 2) {
      return {
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gridTemplateColumns: '1fr',
      };
    }
    if (room.playerCount === 3) {
      return {
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gridTemplateColumns: '1fr 1fr',
      };
    }
    return {
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gridTemplateColumns: '1fr 1fr',
    };
  };

  const getPlayerGridArea = (index: number, total: number) => {
    if (total === 3 && index === 2) {
      return { gridColumn: '1 / -1' };
    }
    return {};
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Player grid */}
      <div className="h-full w-full" style={getGridStyle()}>
        {room.players.map((player, index) => {
          const layout = getPlayerLayout(index, room.playerCount);
          return (
            <div
              key={player.id}
              className={cn(
                'relative',
                highlightedPlayer === player.id && 'ring-4 ring-white ring-inset'
              )}
              style={getPlayerGridArea(index, room.playerCount)}
            >
              <FullScreenPlayerPanel
                player={player}
                onLifeChange={(delta) => updatePlayerLife(player.id, delta)}
                onLifeSet={(life) => setPlayerLife(player.id, life)}
                isAdmin={isAdmin}
                rotation={layout.rotation}
                position={layout.gridArea as any}
              />
            </div>
          );
        })}
      </div>

      {/* Center menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="menu-button w-14 h-14 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {menuOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl p-6 w-[90%] max-w-md space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-foreground">Room {room.id}</h2>
              <span className="text-sm text-muted-foreground px-3 py-1 bg-secondary rounded-full">
                {isAdmin ? 'Admin' : 'View Only'}
              </span>
            </div>

            {isAdmin && (
              <>
                {/* Player count */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Players
                  </label>
                  <div className="flex gap-2">
                    {([2, 3, 4] as const).map((count) => (
                      <button
                        key={count}
                        onClick={() => setPlayerCount(count)}
                        className={cn(
                          'flex-1 py-3 rounded-xl font-display text-2xl transition-all',
                          room.playerCount === count
                            ? 'bg-foreground text-background'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Starting life */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Starting Life
                  </label>
                  <div className="flex gap-2">
                    {([20, 40] as const).map((life) => (
                      <button
                        key={life}
                        onClick={() => setStartingLife(life)}
                        className={cn(
                          'flex-1 py-3 rounded-xl font-display text-2xl transition-all',
                          room.settings.startingLife === life
                            ? 'bg-foreground text-background'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {life}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player names */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Player Names
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {room.players.map((player) => (
                      <input
                        key={player.id}
                        type="text"
                        value={player.name}
                        onChange={(e) => setPlayerName(player.id, e.target.value)}
                        className="px-3 py-2 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        placeholder={`Player ${player.id}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { resetGame(); setMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary rounded-xl text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={randomizeFirstPlayer}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary rounded-xl text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random
                  </button>
                </div>
              </>
            )}

            {/* URLs */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                onClick={() => copyUrl('overlay')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent rounded-xl text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                {copiedUrl === 'overlay' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                Copy Overlay URL (for OBS)
              </button>
              {isAdmin && (
                <button
                  onClick={() => copyUrl('control')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-secondary rounded-xl text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {copiedUrl === 'control' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Admin URL
                </button>
              )}
            </div>

            {/* Back to home */}
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
