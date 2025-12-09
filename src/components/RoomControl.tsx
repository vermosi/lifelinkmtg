import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, RotateCcw, Users, Heart, Copy, Check, Monitor, ArrowLeft, Shuffle, Palette, History, Trash2, Skull, Sparkles, Zap, Swords, Crown, Shield, Sun, Moon, Dices, Save, FolderOpen, Plus } from 'lucide-react';
import { useRoomState } from '@/hooks/useRoomState';
import { getControlUrl, getOverlayUrl, PLAYER_COLORS, formatTimestamp, HistoryEntry, DUNGEON_ROOMS, loadPresets, savePreset, deletePreset, createPresetFromRoom, GamePreset } from '@/lib/roomUtils';
import { FullScreenPlayerPanel } from './FullScreenPlayerPanel';
import { DiceRoller } from './DiceRoller';
import { cn } from '@/lib/utils';

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
    setInitiative,
    advanceDungeon,
    toggleDayNight,
    resetGame,
    setPlayerCount,
    setStartingLife,
    clearHistory,
    loadPreset,
  } = useRoomState(roomId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<'settings' | 'history' | 'dice' | 'presets'>('settings');
  const [colorPickerPlayer, setColorPickerPlayer] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<'control' | 'overlay' | null>(null);
  const [highlightedPlayer, setHighlightedPlayer] = useState<number | null>(null);
  const [presets, setPresets] = useState<GamePreset[]>(() => loadPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

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
    if (entry.type === 'monarch') return 'became Monarch';
    if (entry.type === 'initiative') return 'took the Initiative';
    if (entry.type === 'daynight') return entry.newValue === 1 ? 'Day began' : 'Night fell';
    if (entry.type === 'commander' && entry.fromPlayerName) {
      return `${entry.oldValue} → ${entry.newValue} (from ${entry.fromPlayerName})`;
    }
    return `${entry.oldValue} → ${entry.newValue}`;
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Day/Night indicator */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => isAdmin && toggleDayNight()}
          disabled={!isAdmin}
          className={cn(
            'p-3 rounded-full transition-all shadow-lg',
            room.isDay 
              ? 'bg-amber-400 text-amber-900' 
              : 'bg-indigo-900 text-indigo-200',
            isAdmin && 'hover:scale-110 cursor-pointer'
          )}
          title={room.isDay ? 'Day (click to change)' : 'Night (click to change)'}
          aria-label={room.isDay ? 'Currently Day. Click to switch to Night.' : 'Currently Night. Click to switch to Day.'}
        >
          {room.isDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

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
                hasInitiative={room.initiativeId === player.id}
                dungeonProgress={room.dungeonProgress}
                onLifeChange={(delta) => updatePlayerLife(player.id, delta)}
                onLifeSet={(life) => setPlayerLife(player.id, life)}
                onPoisonChange={(delta) => updatePlayerPoison(player.id, delta)}
                onExperienceChange={(delta) => updatePlayerExperience(player.id, delta)}
                onEnergyChange={(delta) => updatePlayerEnergy(player.id, delta)}
                onCommanderDamageChange={(fromId, delta) => updateCommanderDamage(player.id, fromId, delta)}
                onToggleMonarch={() => setMonarch(room.monarchId === player.id ? null : player.id)}
                onToggleInitiative={() => setInitiative(room.initiativeId === player.id ? null : player.id)}
                onAdvanceDungeon={advanceDungeon}
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
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
          className="fixed inset-0 z-40 bg-background/98 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-6"
          onClick={() => { setMenuOpen(false); setColorPickerPlayer(null); }}
          role="dialog"
          aria-label="Settings menu"
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
                              loadPreset(preset);
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
                  <div className="space-y-2">
                    {room.players.map((player) => (
                      <div key={player.id} className="flex gap-2 items-center">
                        <button
                          onClick={() => setColorPickerPlayer(colorPickerPlayer === player.id ? null : player.id)}
                          className="w-8 h-8 rounded-lg border-2 border-border flex-shrink-0 transition-transform hover:scale-105"
                          style={{ backgroundColor: `hsl(${player.color})` }}
                          aria-label={`Change color for ${player.name}`}
                        />
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => setPlayerName(player.id, e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                        <button
                          onClick={() => setMonarch(room.monarchId === player.id ? null : player.id)}
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
                          onClick={() => setInitiative(room.initiativeId === player.id ? null : player.id)}
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

                  {colorPickerPlayer !== null && (
                    <div className="grid grid-cols-4 gap-2 p-2 bg-secondary rounded-lg">
                      {PLAYER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setPlayerColor(colorPickerPlayer, color.value);
                            setColorPickerPlayer(null);
                          }}
                          className="w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 border-transparent"
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
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={randomizeFirstPlayer}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-foreground text-sm hover:bg-secondary/80"
                  >
                    <Shuffle className="w-4 h-4" /> Random
                  </button>
                </div>

                {/* Overlay tip */}
                <div className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-lg text-center">
                  💡 Open the overlay URL to drag & arrange elements for OBS
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
    </div>
  );
}
