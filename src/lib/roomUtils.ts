// ============= TYPES =============

export type PlayerCount = 2 | 3 | 4 | 5 | 6;

export interface CustomCounter {
  id: string;
  name: string;
  value: number;
  max?: number;
}

export interface Player {
  id: number;
  name: string;
  life: number;
  color: string;
  commanders: string[]; // 0-2 commander names
  counters: {
    poison: number;
    energy: number;
    experience: number;
    storm: number;
    commanderTax: number;
    isMonarch: boolean;
    hasInitiative: boolean;
    custom: CustomCounter[];
  };
  // Commander damage received: { "playerId-commanderIndex": amount }
  commanderDamageReceived: Record<string, number>;
  // Legacy fields for compatibility
  poison?: number;
  experience?: number;
  energy?: number;
  commanderDamage?: Record<number, number>;
  deckName?: string;
  partnerLife?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  playerId: number;
  playerName: string;
  type: 'life' | 'poison' | 'commander' | 'experience' | 'energy' | 'monarch' | 'initiative' | 'daynight' | 'partner' | 'storm' | 'commanderTax' | 'custom';
  oldValue: number;
  newValue: number;
  fromPlayerName?: string;
  counterName?: string;
}

export interface GameTimer {
  running: boolean;
  elapsedMs: number;
  startedAt: number | null;
}

export interface RoomSettings {
  theme: 'dark' | 'light';
  startingLife: 40 | 20 | 30 | 25;
  overlayFontSize: 'small' | 'medium' | 'large';
  showNamesOnOverlay: boolean;
  showBackgroundCards: boolean;
  overlayLayout: 'horizontal' | 'vertical';
  simpleTextStyle: boolean;
  enableHoldToAdjust: boolean;
  enablePartnerTracking: boolean;
  textScale: 'normal' | 'large' | 'extra-large';
  streamerMode: boolean;
  enableSwipeLife: boolean;
}

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface OverlayLayout {
  players: Record<number, OverlayPosition>;
  dayNight: OverlayPosition;
  dungeon: OverlayPosition;
}

export const DUNGEON_ROOMS = [
  'Secret Entrance',
  'Forge',
  'Lost Well',
  'Throne',
] as const;

// Layout configuration for player arrangement
export interface LayoutConfig {
  id: string;
  name: string;
  playerCount: PlayerCount;
  rows: number;
  cols: number;
  playerCells: number[][];
  hasPartner: boolean;
}

export const LAYOUTS: LayoutConfig[] = [
  { id: '2-vertical', name: '2 Vertical', playerCount: 2, rows: 2, cols: 1, playerCells: [[0], [1]], hasPartner: false },
  { id: '2-horizontal', name: '2 Horizontal', playerCount: 2, rows: 1, cols: 2, playerCells: [[0], [1]], hasPartner: false },
  { id: '3-top2', name: '3 Top 2', playerCount: 3, rows: 2, cols: 2, playerCells: [[0], [1], [2, 3]], hasPartner: false },
  { id: '3-bottom2', name: '3 Bottom 2', playerCount: 3, rows: 2, cols: 2, playerCells: [[0, 1], [2], [3]], hasPartner: false },
  { id: '4-grid', name: '4 Grid', playerCount: 4, rows: 2, cols: 2, playerCells: [[0], [1], [2], [3]], hasPartner: false },
  { id: '5-grid', name: '5 Grid', playerCount: 5, rows: 2, cols: 3, playerCells: [[0], [1], [2], [3], [4, 5]], hasPartner: false },
  { id: '6-grid', name: '6 Grid', playerCount: 6, rows: 2, cols: 3, playerCells: [[0], [1], [2], [3], [4], [5]], hasPartner: false },
];

export function getLayoutsForPlayerCount(count: PlayerCount): LayoutConfig[] {
  return LAYOUTS.filter(l => l.playerCount === count);
}

export function getDefaultLayout(count: PlayerCount): LayoutConfig {
  return LAYOUTS.find(l => l.playerCount === count) || LAYOUTS[0];
}

export interface Room {
  id: string;
  adminKey: string;
  playerCount: PlayerCount;
  players: Player[];
  settings: RoomSettings;
  // Turn tracking
  activePlayerIndex: number;
  turnNumber: number;
  gameTimer: GameTimer;
  // Legacy fields
  monarchId: number | null;
  initiativeId: number | null;
  dungeonProgress: number;
  isDay: boolean;
  history: HistoryEntry[];
  overlayLayout: OverlayLayout | null;
  layoutId: string;
  createdAt: number;
  lastUpdated: number;
}

export interface RoomsState {
  rooms: Record<string, Room>;
  recentRoomIds: string[];
}

export interface PlayerPreset {
  name: string;
  color: string;
  commanders?: string[];
}

export interface GamePreset {
  id: string;
  name: string;
  players: PlayerPreset[];
  playerCount: PlayerCount;
  startingLife: 20 | 40 | 30 | 25;
  enabledCounters: string[];
  layoutId: string;
  streamerMode: boolean;
  createdAt: number;
}

export interface PresetsState {
  presets: GamePreset[];
}

// ============= CONSTANTS =============

export const PLAYER_COLORS = [
  { name: 'Gold', value: '45 90% 45%' },
  { name: 'Crimson', value: '345 75% 40%' },
  { name: 'Purple', value: '270 40% 35%' },
  { name: 'Navy', value: '220 60% 30%' },
  { name: 'Forest', value: '140 50% 30%' },
  { name: 'Orange', value: '25 90% 45%' },
  { name: 'Teal', value: '180 60% 35%' },
  { name: 'Rose', value: '330 60% 50%' },
  { name: 'Sky', value: '200 80% 50%' },
  { name: 'Lime', value: '80 70% 40%' },
];

export const DEFAULT_COUNTERS = ['poison', 'energy', 'experience', 'storm', 'commanderTax'] as const;

// ============= PRESETS =============

const PRESETS_KEY = 'lifeTrackerPresets';

export function loadPresets(): GamePreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (stored) {
      const state: PresetsState = JSON.parse(stored);
      return state.presets || [];
    }
  } catch {
    // Ignore errors
  }
  return [];
}

export function savePreset(preset: GamePreset): void {
  const presets = loadPresets();
  const existingIndex = presets.findIndex(p => p.id === preset.id);
  if (existingIndex >= 0) {
    presets[existingIndex] = preset;
  } else {
    presets.push(preset);
  }
  localStorage.setItem(PRESETS_KEY, JSON.stringify({ presets }));
}

export function deletePreset(presetId: string): void {
  const presets = loadPresets().filter(p => p.id !== presetId);
  localStorage.setItem(PRESETS_KEY, JSON.stringify({ presets }));
}

export function createPresetFromRoom(room: Room, presetName: string): GamePreset {
  return {
    id: generateId(8),
    name: presetName,
    players: room.players.map(p => ({ name: p.name, color: p.color, commanders: p.commanders })),
    playerCount: room.playerCount,
    startingLife: room.settings.startingLife as 20 | 40 | 30 | 25,
    enabledCounters: DEFAULT_COUNTERS.filter(() => true), // All enabled by default
    layoutId: room.layoutId,
    streamerMode: room.settings.streamerMode,
    createdAt: Date.now(),
  };
}

// ============= UTILITY FUNCTIONS =============

export function generateId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createDefaultPlayer(index: number, startingLife: number): Player {
  const defaultColors = [
    '45 90% 45%',
    '345 75% 40%',
    '270 40% 35%',
    '220 60% 30%',
    '140 50% 30%',
    '25 90% 45%',
    '180 60% 35%',
    '330 60% 50%',
    '200 80% 50%',
    '80 70% 40%',
  ];

  return {
    id: index + 1,
    name: `Player ${index + 1}`,
    life: startingLife,
    color: defaultColors[index] || '0 0% 50%',
    commanders: [],
    counters: {
      poison: 0,
      energy: 0,
      experience: 0,
      storm: 0,
      commanderTax: 0,
      isMonarch: false,
      hasInitiative: false,
      custom: [],
    },
    commanderDamageReceived: {},
  };
}

export function createDefaultPlayers(count: PlayerCount, startingLife: number): Player[] {
  return Array.from({ length: count }, (_, i) => createDefaultPlayer(i, startingLife));
}

export function createDefaultOverlayLayout(playerCount: number): OverlayLayout {
  const players: Record<number, OverlayPosition> = {};
  const baseY = 85;
  const spacing = 100 / (playerCount + 1);

  for (let i = 1; i <= playerCount; i++) {
    players[i] = { x: spacing * i, y: baseY };
  }

  return {
    players,
    dayNight: { x: 5, y: 5 },
    dungeon: { x: 95, y: 5 },
  };
}

export function createRoom(playerCount: PlayerCount = 4, layoutId?: string): Room {
  const startingLife = 40;
  const layout = layoutId
    ? LAYOUTS.find(l => l.id === layoutId) || getDefaultLayout(playerCount)
    : getDefaultLayout(playerCount);

  return {
    id: generateId(6),
    adminKey: generateId(12),
    playerCount,
    players: createDefaultPlayers(playerCount, startingLife),
    settings: {
      theme: 'dark',
      startingLife,
      overlayFontSize: 'medium',
      showNamesOnOverlay: true,
      showBackgroundCards: true,
      overlayLayout: 'horizontal',
      simpleTextStyle: false,
      enableHoldToAdjust: true,
      enablePartnerTracking: false,
      textScale: 'normal',
      streamerMode: false,
      enableSwipeLife: false,
    },
    activePlayerIndex: 0,
    turnNumber: 1,
    gameTimer: { running: false, elapsedMs: 0, startedAt: null },
    monarchId: null,
    initiativeId: null,
    dungeonProgress: 0,
    isDay: true,
    history: [],
    overlayLayout: createDefaultOverlayLayout(playerCount),
    layoutId: layout.id,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };
}

// Normalize room to ensure all fields exist (for loading from storage)
export function normalizeRoom(room: Room): Room {
  const normalizedPlayers = room.players.map((player, index) => {
    // Handle legacy player format
    const counters = player.counters || {
      poison: player.poison ?? 0,
      energy: player.energy ?? 0,
      experience: player.experience ?? 0,
      storm: 0,
      commanderTax: 0,
      isMonarch: room.monarchId === player.id,
      hasInitiative: room.initiativeId === player.id,
      custom: [],
    };

    // Merge legacy commanderDamage into commanderDamageReceived
    const legacyDamage = player.commanderDamage ?? {};
    const newDamage = player.commanderDamageReceived ?? {};
    const commanderDamageReceived: Record<string, number> = { ...newDamage };
    
    // Convert legacy format (numeric keys) to new format if needed
    for (const [key, value] of Object.entries(legacyDamage)) {
      if (typeof value === 'number' && value > 0) {
        // Legacy key is just playerId, convert to "playerId-0" format
        const newKey = key.includes('-') ? key : `${key}-0`;
        if (!commanderDamageReceived[newKey]) {
          commanderDamageReceived[newKey] = value;
        }
      }
    }

    // Also maintain legacy commanderDamage for backward compatibility
    const commanderDamage: Record<number, number> = {};
    for (const [key, value] of Object.entries(commanderDamageReceived)) {
      const playerId = parseInt(key.split('-')[0], 10);
      if (!isNaN(playerId) && typeof value === 'number') {
        commanderDamage[playerId] = (commanderDamage[playerId] ?? 0) + value;
      }
    }

    return {
      id: player.id ?? index + 1,
      name: player.name ?? `Player ${index + 1}`,
      life: player.life ?? room.settings?.startingLife ?? 40,
      color: player.color ?? PLAYER_COLORS[index]?.value ?? '0 0% 50%',
      commanders: player.commanders ?? (player.deckName ? [player.deckName] : []),
      counters,
      commanderDamageReceived,
      // Legacy fields for compatibility
      poison: counters.poison,
      energy: counters.energy,
      experience: counters.experience,
      commanderDamage,
    };
  });

  return {
    ...room,
    playerCount: (room.playerCount || normalizedPlayers.length || 4) as PlayerCount,
    players: normalizedPlayers,
    settings: {
      theme: room.settings?.theme ?? 'dark',
      startingLife: room.settings?.startingLife ?? 40,
      overlayFontSize: room.settings?.overlayFontSize ?? 'medium',
      showNamesOnOverlay: room.settings?.showNamesOnOverlay ?? true,
      showBackgroundCards: room.settings?.showBackgroundCards ?? true,
      overlayLayout: room.settings?.overlayLayout ?? 'horizontal',
      simpleTextStyle: room.settings?.simpleTextStyle ?? false,
      enableHoldToAdjust: room.settings?.enableHoldToAdjust ?? true,
      enablePartnerTracking: room.settings?.enablePartnerTracking ?? false,
      textScale: room.settings?.textScale ?? 'normal',
      streamerMode: room.settings?.streamerMode ?? false,
      enableSwipeLife: room.settings?.enableSwipeLife ?? false,
    },
    activePlayerIndex: room.activePlayerIndex ?? 0,
    turnNumber: room.turnNumber ?? 1,
    gameTimer: room.gameTimer ?? { running: false, elapsedMs: 0, startedAt: null },
    monarchId: room.monarchId ?? null,
    initiativeId: room.initiativeId ?? null,
    dungeonProgress: room.dungeonProgress ?? 0,
    isDay: room.isDay ?? true,
    history: room.history ?? [],
    overlayLayout: room.overlayLayout ?? createDefaultOverlayLayout(room.playerCount || 4),
    layoutId: room.layoutId ?? getDefaultLayout((room.playerCount || 4) as PlayerCount).id,
    createdAt: room.createdAt ?? Date.now(),
    lastUpdated: room.lastUpdated ?? Date.now(),
  };
}

// ============= URL HELPERS =============

export function getControlUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}?adminKey=${room.adminKey}`;
}

export function getOverlayUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}/overlay?adminKey=${room.adminKey}`;
}

// ============= LOCAL STORAGE =============

export function loadRoomsState(): RoomsState {
  try {
    const stored = localStorage.getItem('lifeTrackerRooms');
    if (stored) {
      const state = JSON.parse(stored);
      // Normalize all rooms
      for (const roomId in state.rooms) {
        state.rooms[roomId] = normalizeRoom(state.rooms[roomId]);
      }
      return state;
    }
  } catch {
    // Ignore errors
  }
  return { rooms: {}, recentRoomIds: [] };
}

export function saveRoomsState(state: RoomsState): void {
  try {
    localStorage.setItem('lifeTrackerRooms', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save rooms state:', error);
  }
}

export function getRoom(roomId: string): Room | null {
  const state = loadRoomsState();
  return state.rooms[roomId] || null;
}

export function saveRoom(room: Room): void {
  const state = loadRoomsState();
  room.lastUpdated = Date.now();
  room.history = room.history.slice(-50);
  state.rooms[room.id] = room;

  state.recentRoomIds = [
    room.id,
    ...state.recentRoomIds.filter(id => id !== room.id)
  ].slice(0, 10);

  saveRoomsState(state);

  window.dispatchEvent(new StorageEvent('storage', {
    key: 'lifeTrackerRooms',
    newValue: JSON.stringify(state),
  }));
}

export function deleteRoom(roomId: string): void {
  const state = loadRoomsState();
  delete state.rooms[roomId];
  state.recentRoomIds = state.recentRoomIds.filter(id => id !== roomId);
  saveRoomsState(state);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

// ============= COMMANDER DAMAGE HELPERS =============

export function getCommanderDamageKey(playerId: number, commanderIndex: number): string {
  return `${playerId}-${commanderIndex}`;
}

export function getTotalCommanderDamageFromPlayer(player: Player, fromPlayerId: number): number {
  let total = 0;
  const commanderDamageReceived = player.commanderDamageReceived ?? {};
  for (const key in commanderDamageReceived) {
    if (key.startsWith(`${fromPlayerId}-`)) {
      total += commanderDamageReceived[key] || 0;
    }
  }
  return total;
}
