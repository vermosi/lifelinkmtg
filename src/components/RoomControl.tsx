import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';
import { Menu, X, RotateCcw, Users, Heart, Copy, Check, Monitor, ArrowLeft, Shuffle, Palette, History, Trash2, Skull, Sparkles, Zap, Swords, Crown, Shield, Sun, Moon, Dices, Save, FolderOpen, Plus, Cloud, Loader2, Wrench } from 'lucide-react';
import { ToolsDrawer } from './ToolsDrawer';
import { useCloudRoomState } from '@/hooks/useCloudRoomState';
import { getControlUrl, getOverlayUrl, PLAYER_COLORS, formatTimestamp, HistoryEntry, DUNGEON_ROOMS, loadPresets, savePreset, deletePreset, createPresetFromRoom, GamePreset, LAYOUTS } from '@/lib/roomUtils';
import { FullScreenPlayerPanel } from './FullScreenPlayerPanel';
import { DiceRoller } from './DiceRoller';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

function HistoryIcon({ type }: { type: HistoryEntry['type'] }) {
  switch (type) {
    case 'life': return <Heart className="w-3 h-3" />;
    case 'poison': return <Skull className="w-3 h-3 text-green-400" />;
    case 'experience': return <Sparkles className="w-3 h-3 text-yellow-400" />;
    case 'energy': return <Zap className="w-3 h-3 text-blue-400" />;
    case 'commander': return <Swords className="w-3 h-3 text-orange-400" />;
    case 'monarch': return <Crown className="w-3 h-3 text-yellow-400" />;
    case 'initiative': return <Shield className="w-3 h-3 text-purple-400" />;
    case 'daynight': return <Sun className="w-3 h-3 text-amber-400" />;
    case 'partner': return <Heart className="w-3 h-3 text-pink-400" />;
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
    syncing,
    updatePlayerLife,
    setPlayerLife,
    setPlayerName,
    setPlayerColor,
    setPlayerCommanders,
    updateCounter,
    toggleMonarch,
    toggleInitiative,
    updateCommanderDamage,
    advanceDungeon,
    toggleDayNight,
    resetGame,
    setPlayerCount,
    setStartingLife,
    clearHistory,
    loadPreset: loadPresetToRoom,
    setSimpleTextStyle,
    setHoldToAdjust,
    undoLastLifeChange,
    nextTurn,
    previousTurn,
    setActivePlayer,
    toggleGameTimer,
    resetGameTimer,
    setOverlayFontSize,
    setOverlayFontFamily,
  } = useCloudRoomState(roomId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<'settings' | 'history' | 'dice' | 'presets'>('settings');
  const [copiedUrl, setCopiedUrl] = useState<'control' | 'overlay' | null>(null);
  const [highlightedPlayer, setHighlightedPlayer] = useState<number | null>(null);
  const [presets, setPresets] = useState<GamePreset[]>(() => loadPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight >= window.innerWidth);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const isAdmin = room ? adminKey === room.adminKey : false;

  // Convert hex to HSL for color picker
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Convert HSL to hex for color picker input
  const hslToHex = (hsl: string): string => {
    const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!parts) return '#888888';
    const h = parseInt(parts[1]) / 360;
    const s = parseInt(parts[2]) / 100;
    const l = parseInt(parts[3]) / 100;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const copyUrl = async (type: 'control' | 'overlay') => {
    const url = type === 'control' ? getControlUrl(room) : getOverlayUrl(room);
    if (!navigator.clipboard) {
      toast({
        title: 'Copy failed',
        description: 'Clipboard access is unavailable in this browser.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL to clipboard.', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy the URL. Please try again.',
      });
    }
  };

  const randomizeFirstPlayer = () => {
    const players = room.players;
    const randomIndex = Math.floor(Math.random() * players.length);
    const selectedPlayer = players[randomIndex];
    if (!selectedPlayer) return;
    setHighlightedPlayer(selectedPlayer.id);
    setTimeout(() => setHighlightedPlayer(null), 3000);
    setMenuOpen(false);
  };

  // Get the current layout configuration
  const currentLayout = LAYOUTS.find(l => l.id === room?.layoutId) || LAYOUTS[0];

  const getPlayerLayout = (index: number, total: number) => {
    // Phone placed in center of table - each player's text should face them
    const { rows } = currentLayout;
    
    if (total === 2) {
      return { rotation: index === 0 ? 180 : 0 };
    }
    if (total === 3) {
      if (isPortrait) {
        return { rotation: index < 2 ? 180 : 0 };
      } else {
        if (index === 0) return { rotation: 90 };
        if (index === 1) return { rotation: 180 };
        return { rotation: -90 };
      }
    }
    // For 4+ players, use row-based rotation
    // Calculate which row this player is in based on layout
    const cols = currentLayout.cols;
    const playerRow = Math.floor(index / cols);
    const topHalf = playerRow < rows / 2;
    
    if (isPortrait) {
      return { rotation: topHalf ? 180 : 0 };
    } else {
      return { rotation: topHalf ? 180 : 0 };
    }
  };

  const getGridStyle = () => {
    const { rows, cols } = currentLayout;
    return {
      display: 'grid',
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
    };
  };

  const getPlayerGridArea = (index: number, total: number) => {
    const cells = currentLayout.playerCells[index];
    if (!cells || cells.length <= 1) return {};
    
    // Calculate grid area from cells
    const { cols } = currentLayout;
    const minRow = Math.floor(Math.min(...cells) / cols);
    const maxRow = Math.floor(Math.max(...cells) / cols);
    const minCol = Math.min(...cells.map(c => c % cols));
    const maxCol = Math.max(...cells.map(c => c % cols));
    
    return {
      gridRow: `${minRow + 1} / ${maxRow + 2}`,
      gridColumn: `${minCol + 1} / ${maxCol + 2}`,
    };
  };

  const formatHistoryChange = (entry: HistoryEntry) => {
    if (entry.type === 'monarch') return 'became Monarch';
    if (entry.type === 'initiative') return 'took the Initiative';
    if (entry.type === 'daynight') return entry.newValue === 1 ? 'Day began' : 'Night fell';
    if (entry.type === 'commander' && entry.fromPlayerName) {
      return `${entry.oldValue} → ${entry.newValue} (from ${entry.fromPlayerName})`;
    }
    return `${entry.oldValue} → ${entry.newValue}`;
  };

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!room) return;
    const hasSelected = room.players.some((player) => player.id === selectedPlayerId);
    if (!selectedPlayerId || !hasSelected) {
      setSelectedPlayerId(room.players[0]?.id ?? null);
    }
  }, [room, selectedPlayerId]);

  useEffect(() => {
    if (!room || hasTrackedStart) return;
    trackEvent('game_started', { roomId: room.id });
    setHasTrackedStart(true);
  }, [room, hasTrackedStart]);

  useEffect(() => {
    if (!room || !isAdmin) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (menuOpen) return;

      const key = event.key;
      if (['+', '-', '=', 'u', 'U', 'r', 'R', '1', '2', '3', '4', '5', '6'].includes(key)) {
        event.preventDefault();
      }

      if (key >= '1' && key <= '6') {
        const index = Number(key) - 1;
        const player = room.players[index];
        if (player) {
          setSelectedPlayerId(player.id);
        }
        return;
      }

      const activePlayerId = selectedPlayerId ?? room.players[0]?.id;
      if (!activePlayerId) return;

      if (key === '+' || key === '=') {
        updatePlayerLife(activePlayerId, 1);
      }
      if (key === '-') {
        updatePlayerLife(activePlayerId, -1);
      }
      if (key === 'u' || key === 'U') {
        undoLastLifeChange();
      }
      if (key === 'r' || key === 'R') {
        if (window.confirm('Reset the match? This will clear life totals and counters.')) {
          resetGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room, isAdmin, menuOpen, selectedPlayerId, updatePlayerLife, undoLastLifeChange, resetGame]);

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

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
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
              playerCount={room.playerCount}
              isMonarch={room.monarchId === player.id}
              hasInitiative={room.initiativeId === player.id}
              dungeonProgress={room.dungeonProgress}
              onLifeChange={(delta) => updatePlayerLife(player.id, delta)}
              onLifeSet={(life) => setPlayerLife(player.id, life)}
              onPoisonChange={(delta) => updateCounter(player.id, 'poison', delta)}
              onExperienceChange={(delta) => updateCounter(player.id, 'experience', delta)}
              onEnergyChange={(delta) => updateCounter(player.id, 'energy', delta)}
              onCommanderDamageChange={(fromId, delta) => updateCommanderDamage(player.id, fromId, 0, delta)}
              onToggleMonarch={() => toggleMonarch(player.id)}
              onToggleInitiative={() => toggleInitiative(player.id)}
              onDeckNameChange={(deckName) => setPlayerCommanders(player.id, deckName ? [deckName] : [])}
              isAdmin={isAdmin}
              rotation={layout.rotation}
              isSelected={isAdmin && selectedPlayerId === player.id}
              enableHoldToAdjust={room.settings.enableHoldToAdjust}
              onSelect={() => setSelectedPlayerId(player.id)}
            />
            </div>
          );
        })}
      </div>

      {/* Center menu button - clean, minimal */}
      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          className="menu-button w-12 h-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/98 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-6"
          onClick={() => { setMenuOpen(false); }}
          role="dialog"
          aria-label="Settings menu"
        >
          <div 
            className="bg-card border border-border rounded-2xl p-5 w-[90%] max-w-md space-y-4 my-auto max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button in top right of dialog */}
            <button
              onClick={() => { setMenuOpen(false); }}
              className="absolute top-3 right-3 p-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pr-10">
              <h2 className="font-display text-2xl text-foreground">Room {room.id}</h2>
              <div className="flex items-center gap-2">
                {syncing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                )}
                <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  {isAdmin ? 'Admin' : 'View Only'}
                </span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1" role="tablist">
              <button
                onClick={() => setMenuTab('settings')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                  menuTab === 'settings' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
                role="tab"
                aria-selected={menuTab === 'settings'}
              >
                <Palette className="w-3 h-3" /> Settings
              </button>
              <button
                onClick={() => setMenuTab('presets')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                  menuTab === 'presets' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
                role="tab"
                aria-selected={menuTab === 'presets'}
              >
                <FolderOpen className="w-3 h-3" /> Presets
              </button>
              <button
                onClick={() => setMenuTab('dice')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                  menuTab === 'dice' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
                role="tab"
                aria-selected={menuTab === 'dice'}
              >
                <Dices className="w-3 h-3" /> Dice
              </button>
              <button
                onClick={() => setMenuTab('history')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                  menuTab === 'history' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
                role="tab"
                aria-selected={menuTab === 'history'}
              >
                <History className="w-3 h-3" />
                {room.history.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1 rounded">
                    {room.history.length}
                  </span>
                )}
              </button>
            </div>

            {/* Dice tab */}
            {menuTab === 'dice' && <DiceRoller />}

            {/* Presets tab */}
            {menuTab === 'presets' && (
              <div className="space-y-3">
                {isAdmin && (
                  <>
                    {showSavePreset ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                          placeholder="Preset name..."
                          className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (newPresetName.trim() && room) {
                              const preset = createPresetFromRoom(room, newPresetName.trim());
                              savePreset(preset);
                              setPresets(loadPresets());
                              setNewPresetName('');
                              setShowSavePreset(false);
                            }
                          }}
                          disabled={!newPresetName.trim()}
                          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setShowSavePreset(false); setNewPresetName(''); }}
                          className="px-3 py-2 bg-secondary text-muted-foreground rounded-lg text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSavePreset(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent/90"
                      >
                        <Plus className="w-4 h-4" /> Save Current Setup as Preset
                      </button>
                    )}
                  </>
                )}

                {presets.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No presets saved yet.
                    {isAdmin && <div className="mt-1">Save your current playgroup setup!</div>}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="p-3 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{preset.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                              {preset.playerCount}P • {preset.startingLife}HP
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  deletePreset(preset.id);
                                  setPresets(loadPresets());
                                }}
                                className="p-1 text-destructive/70 hover:text-destructive"
                                title="Delete preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 mb-2">
                          {preset.players.map((p, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                              style={{ backgroundColor: `hsl(${p.color} / 0.2)` }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: `hsl(${p.color})` }}
                              />
                              <span className="text-foreground truncate max-w-16">{p.name}</span>
                            </div>
                          ))}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              loadPresetToRoom(preset);
                              setMenuOpen(false);
                            }}
                            className="w-full py-1.5 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg text-xs font-medium transition-colors"
                          >
                            Load Preset
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

                {/* Day/Night toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    {room.isDay ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />} Day/Night
                  </label>
                  <button
                    onClick={toggleDayNight}
                    className={cn(
                      'w-full py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all',
                      room.isDay
                        ? 'bg-amber-400/20 text-amber-400 hover:bg-amber-400/30'
                        : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    )}
                  >
                    {room.isDay ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {room.isDay ? 'Day' : 'Night'}
                  </button>
                </div>

                {/* Player names & colors */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Players
                  </label>
                  <div className="space-y-3">
                    {room.players.map((player) => (
                      <div key={player.id} className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <label className="relative w-8 h-8 rounded-lg border-2 border-border flex-shrink-0 overflow-hidden cursor-pointer transition-transform hover:scale-105">
                            <input
                              type="color"
                              value={hslToHex(player.color)}
                              onChange={(e) => setPlayerColor(player.id, hexToHsl(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              aria-label={`Change color for ${player.name}`}
                            />
                            <div 
                              className="w-full h-full"
                              style={{ backgroundColor: `hsl(${player.color})` }}
                            />
                          </label>
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => setPlayerName(player.id, e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          />
                          <button
                            onClick={() => toggleMonarch(player.id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-all',
                              room.monarchId === player.id 
                                ? 'bg-yellow-400/20 text-yellow-400' 
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            )}
                            title="Monarch"
                          >
                            <Crown className="w-4 h-4" fill={room.monarchId === player.id ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => toggleInitiative(player.id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-all',
                              room.initiativeId === player.id 
                                ? 'bg-purple-400/20 text-purple-400' 
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            )}
                            title="Initiative"
                          >
                            <Shield className="w-4 h-4" fill={room.initiativeId === player.id ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        {/* Preset colors row */}
                        <div className="flex gap-1 pl-10">
                          {PLAYER_COLORS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setPlayerColor(player.id, color.value)}
                              className={cn(
                                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                                player.color === color.value ? 'border-white scale-110' : 'border-transparent'
                              )}
                              style={{ backgroundColor: `hsl(${color.value})` }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {room.initiativeId && (
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <div className="text-xs text-purple-400 mb-1">Dungeon: {DUNGEON_ROOMS[room.dungeonProgress]}</div>
                      <div className="flex gap-1 items-center">
                        {DUNGEON_ROOMS.map((_, idx) => (
                          <div
                            key={idx}
                            className={cn('flex-1 h-1.5 rounded-full', idx <= room.dungeonProgress ? 'bg-purple-500' : 'bg-purple-500/20')}
                          />
                        ))}
                        <button
                          onClick={advanceDungeon}
                          disabled={room.dungeonProgress >= 3}
                          className="text-xs px-2 py-0.5 ml-1 rounded bg-purple-500/30 text-purple-300 disabled:opacity-50"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={undoLastLifeChange}
                    disabled={!room.history.some((entry) => entry.type === 'life')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" /> Undo
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset the match? This will clear life totals and counters.')) {
                        resetGame();
                        setMenuOpen(false);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Match
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={randomizeFirstPlayer}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80"
                  >
                    <Shuffle className="w-4 h-4" /> Random
                  </button>
                </div>

                {/* Overlay settings */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Monitor className="w-3 h-3" /> Stream Overlay
                  </label>
                  
                  {/* Font Size */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Font Size</span>
                    <div className="flex gap-1">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setOverlayFontSize(size)}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all capitalize',
                            room.settings.overlayFontSize === size
                              ? 'bg-foreground text-background'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Font Family</span>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { id: 'bebas', label: 'Bebas' },
                        { id: 'inter', label: 'Inter' },
                        { id: 'roboto', label: 'Roboto' },
                        { id: 'oswald', label: 'Oswald' },
                        { id: 'anton', label: 'Anton' },
                      ] as const).map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setOverlayFontFamily(font.id)}
                          className={cn(
                            'py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                            room.settings.overlayFontFamily === font.id
                              ? 'bg-foreground text-background'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSimpleTextStyle(!room.settings.simpleTextStyle)}
                    className={cn(
                      'w-full py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between',
                      room.settings.simpleTextStyle
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Simple Text (OBS)</span>
                    <span className="text-xs opacity-70">
                      {room.settings.simpleTextStyle ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <p className="text-xs text-muted-foreground">
                    White text with black outline - no backgrounds
                  </p>
                </div>

                {/* Interaction settings */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Touch Controls</label>
                  <button
                    onClick={() => setHoldToAdjust(!room.settings.enableHoldToAdjust)}
                    className={cn(
                      'w-full py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between',
                      room.settings.enableHoldToAdjust
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Press & Hold to Auto-Adjust</span>
                    <span className="text-xs opacity-70">
                      {room.settings.enableHoldToAdjust ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Hold +/− buttons to keep adjusting life totals.
                  </p>
                </div>

                {/* Overlay tip */}
                <div className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-lg text-center">
                  💡 Use /room/{room.id}/overlay (Edit Layout) to arrange elements. /overlay is view-only for OBS.
                </div>
              </>
            )}

            {menuTab === 'history' && (
              <div className="space-y-3">
                {room.history.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No changes yet</div>
                ) : (
                  <>
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {[...room.history].reverse().map((entry) => (
                        <div key={entry.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-secondary/50">
                          <HistoryIcon type={entry.type} />
                          <span className="font-medium text-foreground">{entry.playerName}</span>
                          <span className="text-muted-foreground flex-1 truncate">{formatHistoryChange(entry)}</span>
                          <span className="text-xs text-muted-foreground/60">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                    {isAdmin && (
                      <button onClick={clearHistory} className="w-full py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20">
                        <Trash2 className="w-4 h-4 inline mr-2" />Clear
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {menuTab === 'settings' && !isAdmin && (
              <div className="text-center py-4 text-muted-foreground text-sm">View-only mode</div>
            )}

            {/* URLs */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                onClick={() => copyUrl('overlay')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-accent rounded-xl text-accent-foreground text-sm font-medium hover:bg-accent/90"
              >
                {copiedUrl === 'overlay' ? <Check className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                Copy Overlay URL
              </button>
              {isAdmin && (
                <button
                  onClick={() => copyUrl('control')}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80"
                >
                  {copiedUrl === 'control' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Admin URL
                </button>
              )}

              <div className="space-y-3 pt-2">
                <div className="bg-secondary/50 rounded-xl p-3 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Scan to open overlay</span>
                  <div className="bg-white p-2 rounded-lg">
                    <QRCode
                      value={getOverlayUrl(room)}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      aria-label="QR code for overlay URL"
                    />
                  </div>
                </div>
                {isAdmin && (
                  <div className="bg-secondary/50 rounded-xl p-3 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Scan to control this room</span>
                    <div className="bg-white p-2 rounded-lg">
                      <QRCode
                        value={getControlUrl(room)}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        aria-label="QR code for admin control URL"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
          </div>
        </div>
      )}

      {/* Tools Drawer FAB - bottom right */}
      {!menuOpen && room && isAdmin && (
        <button
          onClick={() => setToolsDrawerOpen(true)}
          className="tools-fab bottom-6 right-6"
          aria-label="Open tools"
        >
          <Dices className="w-6 h-6 text-foreground" />
        </button>
      )}

      {/* Tools Drawer */}
      {room && (
        <ToolsDrawer
          isOpen={toolsDrawerOpen}
          onClose={() => setToolsDrawerOpen(false)}
          room={room}
          isAdmin={isAdmin}
          onNextTurn={nextTurn}
          onPreviousTurn={previousTurn}
          onSetActivePlayer={setActivePlayer}
          onToggleGameTimer={toggleGameTimer}
          onResetGameTimer={resetGameTimer}
          onResetGame={resetGame}
          onSetPlayerCount={setPlayerCount}
        />
      )}
    </div>
  );
}
