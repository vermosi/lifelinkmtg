import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Copy, Check, RotateCcw, Users, Heart, Settings, ArrowLeft, Monitor, Shuffle } from 'lucide-react';
import { useRoomState } from '@/hooks/useRoomState';
import { getControlUrl, getOverlayUrl } from '@/lib/roomUtils';
import { PlayerPanel } from './PlayerPanel';
import { Button } from '@/components/ui/button';
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

  const [copiedUrl, setCopiedUrl] = useState<'control' | 'overlay' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [highlightedPlayer, setHighlightedPlayer] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="font-display text-2xl text-foreground">Room not found</div>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
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
  };

  const getGridClass = () => {
    switch (room.playerCount) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">Room {room.id}</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Admin Control' : 'View Only'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && isAdmin && (
        <div className="p-4 border-b border-border bg-card/50 animate-fade-in">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* Player count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Players
                </label>
                <div className="flex gap-1">
                  {([2, 3, 4] as const).map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-display font-semibold transition-all',
                        room.playerCount === count
                          ? 'bg-primary text-primary-foreground'
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
                <div className="flex gap-1">
                  {([20, 40] as const).map((life) => (
                    <button
                      key={life}
                      onClick={() => setStartingLife(life)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-display font-semibold transition-all',
                        room.settings.startingLife === life
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {life}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Actions</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetGame}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={randomizeFirstPlayer}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random
                  </Button>
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyUrl('control')}
                  className="gap-2"
                >
                  {copiedUrl === 'control' ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Control URL
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyUrl('overlay')}
                className="gap-2"
              >
                {copiedUrl === 'overlay' ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                Copy Overlay URL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Player grid */}
      <main className="flex-1 p-4">
        <div className={cn('grid gap-4 h-full max-w-4xl mx-auto', getGridClass())}>
          {room.players.map((player) => (
            <div
              key={player.id}
              className={cn(
                'transition-all duration-300',
                highlightedPlayer === player.id && 'ring-4 ring-primary rounded-2xl animate-pulse'
              )}
            >
              <PlayerPanel
                player={player}
                onLifeChange={(delta) => updatePlayerLife(player.id, delta)}
                onLifeSet={(life) => setPlayerLife(player.id, life)}
                onNameChange={(name) => setPlayerName(player.id, name)}
                isAdmin={isAdmin}
                compact={room.playerCount >= 3}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Footer info */}
      <footer className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        {isAdmin ? (
          <span>Overlay URL: <code className="bg-secondary px-2 py-1 rounded">/room/{room.id}/overlay</code></span>
        ) : (
          <span>View-only mode • Admin access required to make changes</span>
        )}
      </footer>
    </div>
  );
}
