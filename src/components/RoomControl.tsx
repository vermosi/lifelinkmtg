import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, RotateCcw, Users, Heart, Copy, Check, Monitor, ArrowLeft, Shuffle, Palette, History, Trash2, Skull, Sparkles, Zap, Swords, Crown } from 'lucide-react';
import { useRoomState } from '@/hooks/useRoomState';
import { getControlUrl, getOverlayUrl, PLAYER_COLORS, formatTimestamp, HistoryEntry } from '@/lib/roomUtils';
import { FullScreenPlayerPanel } from './FullScreenPlayerPanel';
import { cn } from '@/lib/utils';

function HistoryIcon({ type }: { type: HistoryEntry['type'] }) {
  switch (type) {
    case 'life': return <Heart className="w-3 h-3" />;
    case 'poison': return <Skull className="w-3 h-3 text-green-400" />;
    case 'experience': return <Sparkles className="w-3 h-3 text-yellow-400" />;
    case 'energy': return <Zap className="w-3 h-3 text-blue-400" />;
    case 'commander': return <Swords className="w-3 h-3 text-orange-400" />;
    case 'monarch': return <Crown className="w-3 h-3 text-yellow-400" />;
    default: return null;
  }
}

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
    setPlayerColor,
    updatePlayerPoison,
    updatePlayerExperience,
    updatePlayerEnergy,
    updateCommanderDamage,
    setMonarch,
    resetGame,
    setPlayerCount,
    setStartingLife,
    clearHistory,
  } = useRoomState(roomId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<'settings' | 'history'>('settings');
  const [colorPickerPlayer, setColorPickerPlayer] = useState<number | null>(null);
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

  const getPlayerLayout = (index: number, total: number) => {
    if (total === 2) {
      return { rotation: index === 0 ? 180 : 0 };
    }
    if (total === 3) {
      return { rotation: index < 2 ? 180 : 0 };
    }
    return { rotation: index < 2 ? 180 : 0 };
  };

  const getGridStyle = () => {
    if (room.playerCount === 2) {
      return { display: 'grid', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr' };
    }
    return { display: 'grid', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr' };
  };

  const getPlayerGridArea = (index: number, total: number) => {
    if (total === 3 && index === 2) {
      return { gridColumn: '1 / -1' };
    }
    return {};
  };

  const formatHistoryChange = (entry: HistoryEntry) => {
    if (entry.type === 'monarch') {
      return 'became Monarch';
    }
    if (entry.type === 'commander' && entry.fromPlayerName) {
      return `${entry.oldValue} → ${entry.newValue} (from ${entry.fromPlayerName})`;
    }
    return `${entry.oldValue} → ${entry.newValue}`;
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
                highlightedPlayer === player.id && 'ring-4 ring-white ring-inset animate-pulse'
              )}
              style={getPlayerGridArea(index, room.playerCount)}
            >
              <FullScreenPlayerPanel
                player={player}
                allPlayers={room.players}
                isMonarch={room.monarchId === player.id}
                onLifeChange={(delta) => updatePlayerLife(player.id, delta)}
                onLifeSet={(life) => setPlayerLife(player.id, life)}
                onPoisonChange={(delta) => updatePlayerPoison(player.id, delta)}
                onExperienceChange={(delta) => updatePlayerExperience(player.id, delta)}
                onEnergyChange={(delta) => updatePlayerEnergy(player.id, delta)}
                onCommanderDamageChange={(fromId, delta) => updateCommanderDamage(player.id, fromId, delta)}
                onToggleMonarch={() => setMonarch(room.monarchId === player.id ? null : player.id)}
                isAdmin={isAdmin}
                rotation={layout.rotation}
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
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-6"
          onClick={() => { setMenuOpen(false); setColorPickerPlayer(null); }}
        >
          <div 
            className="bg-card border border-border rounded-2xl p-5 w-[90%] max-w-md space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground">Room {room.id}</h2>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                {isAdmin ? 'Admin' : 'View Only'}
              </span>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setMenuTab('settings')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  menuTab === 'settings' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Palette className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => setMenuTab('history')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  menuTab === 'history' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
              >
                <History className="w-4 h-4" /> History
                {room.history.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">
                    {room.history.length}
                  </span>
                )}
              </button>
            </div>

            {menuTab === 'settings' && isAdmin && (
              <>
                {/* Player count */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" /> Players
                  </label>
                  <div className="flex gap-2">
                    {([2, 3, 4] as const).map((count) => (
                      <button
                        key={count}
                        onClick={() => setPlayerCount(count)}
                        className={cn(
                          'flex-1 py-2 rounded-xl font-display text-xl transition-all',
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
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="w-3 h-3" /> Starting Life
                  </label>
                  <div className="flex gap-2">
                    {([20, 40] as const).map((life) => (
                      <button
                        key={life}
                        onClick={() => setStartingLife(life)}
                        className={cn(
                          'flex-1 py-2 rounded-xl font-display text-xl transition-all',
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

                {/* Player names & colors */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Players & Colors
                  </label>
                  <div className="space-y-2">
                    {room.players.map((player) => (
                      <div key={player.id} className="flex gap-2 items-center">
                        <button
                          onClick={() => setColorPickerPlayer(colorPickerPlayer === player.id ? null : player.id)}
                          className="w-9 h-9 rounded-lg border-2 border-border flex-shrink-0 transition-transform hover:scale-105"
                          style={{ backgroundColor: `hsl(${player.color})` }}
                        />
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => setPlayerName(player.id, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                        <button
                          onClick={() => setMonarch(room.monarchId === player.id ? null : player.id)}
                          className={cn(
                            'p-2 rounded-lg transition-all',
                            room.monarchId === player.id 
                              ? 'bg-yellow-400/20 text-yellow-400' 
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          )}
                          title="Toggle Monarch"
                        >
                          <Crown className="w-4 h-4" fill={room.monarchId === player.id ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {colorPickerPlayer !== null && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-secondary rounded-xl mt-2">
                      {PLAYER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setPlayerColor(colorPickerPlayer, color.value);
                            setColorPickerPlayer(null);
                          }}
                          className={cn(
                            "w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110",
                            room.players.find(p => p.id === colorPickerPlayer)?.color === color.value
                              ? 'border-white'
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: `hsl(${color.value})` }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { resetGame(); setMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={randomizeFirstPlayer}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random
                  </button>
                </div>

                {/* Hint */}
                <div className="text-center text-xs text-muted-foreground py-2 px-3 bg-secondary/50 rounded-lg">
                  💡 Long-press or right-click a panel for counters
                </div>
              </>
            )}

            {menuTab === 'history' && (
              <div className="space-y-3">
                {room.history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No changes recorded yet
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {[...room.history].reverse().map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg bg-secondary/50"
                        >
                          <HistoryIcon type={entry.type} />
                          <span className="font-medium text-foreground">{entry.playerName}</span>
                          <span className="text-muted-foreground flex-1 truncate">
                            {formatHistoryChange(entry)}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={clearHistory}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear History
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {menuTab === 'settings' && !isAdmin && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                View-only mode. Admin access required to change settings.
              </div>
            )}

            {/* URLs */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                onClick={() => copyUrl('overlay')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent rounded-xl text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                {copiedUrl === 'overlay' ? <Check className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                Copy Overlay URL (for OBS)
              </button>
              {isAdmin && (
                <button
                  onClick={() => copyUrl('control')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  {copiedUrl === 'control' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Admin URL
                </button>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
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
