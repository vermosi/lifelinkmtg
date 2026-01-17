export interface Player {
  id: number;
  name: string;
  life: number;
  color: string;
  poison: number;
  experience: number;
  energy: number;
  commanderDamage: Record<number, number>;
  deckName?: string;
  partnerLife?: number; // Partner commander life tracking
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  playerId: number;
  playerName: string;
  type: 'life' | 'poison' | 'commander' | 'experience' | 'energy' | 'monarch' | 'initiative' | 'daynight' | 'partner';
  oldValue: number;
  newValue: number;
  fromPlayerName?: string;
}

export interface RoomSettings {
  theme: 'dark' | 'light';
  startingLife: 40 | 20;
  overlayFontSize: 'small' | 'medium' | 'large';
  showNamesOnOverlay: boolean;
  showBackgroundCards: boolean;
  overlayLayout: 'horizontal' | 'vertical';
  simpleTextStyle: boolean;
  enableHoldToAdjust: boolean;
  enablePartnerTracking: boolean; // Partner commander mode
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
export type PlayerCount = 2 | 3 | 4 | 5 | 6;

export interface LayoutConfig {
  id: string;
  name: string;
  playerCount: PlayerCount;
  // Grid configuration: rows x cols, with player positions
  rows: number;
  cols: number;
  // Which cells each player occupies (0-indexed, row-major order)
  // Each player can span multiple cells for asymmetric layouts
  playerCells: number[][]; // Array of cell indices for each player
  hasPartner: boolean; // If true, shows partner life split
}

// Predefined layouts matching the Lotus app style
export const LAYOUTS: LayoutConfig[] = [
  // 2 Players
  { id: '2-vertical', name: '2 Vertical', playerCount: 2, rows: 2, cols: 1, playerCells: [[0], [1]], hasPartner: false },
  { id: '2-vertical-partner', name: '2 Vertical Partner', playerCount: 2, rows: 2, cols: 2, playerCells: [[0, 1], [2, 3]], hasPartner: true },
  { id: '2-horizontal', name: '2 Horizontal', playerCount: 2, rows: 1, cols: 2, playerCells: [[0], [1]], hasPartner: false },
  
  // 3 Players
  { id: '3-top2', name: '3 Top 2', playerCount: 3, rows: 2, cols: 2, playerCells: [[0], [1], [2, 3]], hasPartner: false },
  { id: '3-bottom2', name: '3 Bottom 2', playerCount: 3, rows: 2, cols: 2, playerCells: [[0, 1], [2], [3]], hasPartner: false },
  { id: '3-horizontal', name: '3 Horizontal', playerCount: 3, rows: 1, cols: 3, playerCells: [[0], [1], [2]], hasPartner: false },
  { id: '3-partner', name: '3 Partner', playerCount: 3, rows: 2, cols: 4, playerCells: [[0, 1], [2, 3], [4, 5, 6, 7]], hasPartner: true },
  
  // 4 Players
  { id: '4-grid', name: '4 Grid', playerCount: 4, rows: 2, cols: 2, playerCells: [[0], [1], [2], [3]], hasPartner: false },
  { id: '4-partner', name: '4 Partner', playerCount: 4, rows: 2, cols: 4, playerCells: [[0, 1], [2, 3], [4, 5], [6, 7]], hasPartner: true },
  { id: '4-horizontal', name: '4 Horizontal', playerCount: 4, rows: 1, cols: 4, playerCells: [[0], [1], [2], [3]], hasPartner: false },
  { id: '4-vertical', name: '4 Vertical', playerCount: 4, rows: 4, cols: 1, playerCells: [[0], [1], [2], [3]], hasPartner: false },
  
  // 5 Players
  { id: '5-top3', name: '5 Top 3', playerCount: 5, rows: 2, cols: 3, playerCells: [[0], [1], [2], [3], [4, 5]], hasPartner: false },
  { id: '5-bottom3', name: '5 Bottom 3', playerCount: 5, rows: 2, cols: 3, playerCells: [[0, 1], [2], [3], [4], [5]], hasPartner: false },
  { id: '5-partner', name: '5 Partner', playerCount: 5, rows: 2, cols: 6, playerCells: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9, 10, 11]], hasPartner: true },
  
  // 6 Players
  { id: '6-grid', name: '6 Grid', playerCount: 6, rows: 2, cols: 3, playerCells: [[0], [1], [2], [3], [4], [5]], hasPartner: false },
  { id: '6-grid-alt', name: '6 Grid Alt', playerCount: 6, rows: 3, cols: 2, playerCells: [[0], [1], [2], [3], [4], [5]], hasPartner: false },
  { id: '6-partner', name: '6 Partner', playerCount: 6, rows: 2, cols: 6, playerCells: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]], hasPartner: true },
];

export function getLayoutsForPlayerCount(count: PlayerCount): LayoutConfig[] {
  return LAYOUTS.filter(l => l.playerCount === count);
}

export function getDefaultLayout(count: PlayerCount): LayoutConfig {
  const layouts = getLayoutsForPlayerCount(count);
  return layouts[0] || LAYOUTS[0];
}

export interface Room {
  id: string;
  adminKey: string;
  playerCount: PlayerCount;
  players: Player[];
  settings: RoomSettings;
  monarchId: number | null;
  initiativeId: number | null;
  dungeonProgress: number;
  isDay: boolean;
  history: HistoryEntry[];
  overlayLayout: OverlayLayout | null;
  layoutId: string; // Which layout configuration to use
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
}

export interface GamePreset {
  id: string;
  name: string;
  players: PlayerPreset[];
  playerCount: PlayerCount;
  startingLife: 20 | 40;
  createdAt: number;
}

export interface PresetsState {
  presets: GamePreset[];
}

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
    players: room.players.map(p => ({ name: p.name, color: p.color })),
    playerCount: room.playerCount,
    startingLife: room.settings.startingLife,
    createdAt: Date.now(),
  };
}


export const PLAYER_COLORS = [
  { name: 'Gold', value: '45 90% 45%' },
  { name: 'Crimson', value: '345 75% 40%' },
  { name: 'Purple', value: '270 40% 35%' },
  { name: 'Navy', value: '220 60% 30%' },
  { name: 'Forest', value: '140 50% 30%' },
  { name: 'Orange', value: '25 90% 45%' },
  { name: 'Teal', value: '180 60% 35%' },
  { name: 'Rose', value: '330 60% 50%' },
];

export function generateId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createDefaultPlayers(count: PlayerCount, startingLife: number, enablePartner: boolean = false): Player[] {
  const defaultColors = [
    '45 90% 45%',
    '345 75% 40%',
    '270 40% 35%',
    '220 60% 30%',
    '140 50% 30%',
    '25 90% 45%',
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    life: startingLife,
    color: defaultColors[i] || '0 0% 50%',
    poison: 0,
    experience: 0,
    energy: 0,
    commanderDamage: {},
    partnerLife: enablePartner ? startingLife : undefined,
  }));
}

export function createDefaultOverlayLayout(playerCount: number): OverlayLayout {
  const players: Record<number, OverlayPosition> = {};
  const baseY = 85; // percentage from top
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
  const enablePartner = layout.hasPartner;
  
  return {
    id: generateId(6),
    adminKey: generateId(12),
    playerCount,
    players: createDefaultPlayers(playerCount, startingLife, enablePartner),
    settings: {
      theme: 'dark',
      startingLife,
      overlayFontSize: 'medium',
      showNamesOnOverlay: true,
      showBackgroundCards: true,
      overlayLayout: 'horizontal',
      simpleTextStyle: false,
      enableHoldToAdjust: false,
      enablePartnerTracking: enablePartner,
    },
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

export function normalizeRoom(room: Room): Room {
  const validPlayerCounts: Array<PlayerCount> = [2, 3, 4, 5, 6];
  const basePlayers = Array.isArray(room.players) ? room.players : [];
  const inferredCount = validPlayerCounts.includes(room.playerCount as PlayerCount)
    ? room.playerCount
    : (validPlayerCounts.includes(basePlayers.length as PlayerCount)
      ? (basePlayers.length as PlayerCount)
      : 4);
  const normalizedPlayers = basePlayers.length
    ? basePlayers.map((player, index) => ({
        id: player.id ?? index + 1,
        name: player.name ?? `Player ${index + 1}`,
        life: player.life ?? room.settings?.startingLife ?? 40,
        color: player.color ?? PLAYER_COLORS[index]?.value ?? '0 0% 50%',
        poison: player.poison ?? 0,
        experience: player.experience ?? 0,
        energy: player.energy ?? 0,
        commanderDamage: player.commanderDamage ?? {},
        deckName: player.deckName,
        partnerLife: player.partnerLife,
      }))
    : createDefaultPlayers(inferredCount, room.settings?.startingLife ?? 40);
  const normalizedSettings = {
    theme: room.settings?.theme ?? 'dark',
    startingLife: room.settings?.startingLife ?? 40,
    overlayFontSize: room.settings?.overlayFontSize ?? 'medium',
    showNamesOnOverlay: room.settings?.showNamesOnOverlay ?? true,
    showBackgroundCards: room.settings?.showBackgroundCards ?? true,
    overlayLayout: room.settings?.overlayLayout ?? 'horizontal',
    simpleTextStyle: room.settings?.simpleTextStyle ?? false,
    enableHoldToAdjust: room.settings?.enableHoldToAdjust ?? false,
    enablePartnerTracking: room.settings?.enablePartnerTracking ?? false,
  };

  return {
    ...room,
    playerCount: inferredCount,
    players: normalizedPlayers,
    settings: normalizedSettings,
    monarchId: room.monarchId ?? null,
    initiativeId: room.initiativeId ?? null,
    dungeonProgress: room.dungeonProgress ?? 0,
    isDay: room.isDay ?? true,
    history: room.history ?? [],
    overlayLayout: room.overlayLayout ?? createDefaultOverlayLayout(inferredCount),
    layoutId: room.layoutId ?? getDefaultLayout(inferredCount).id,
    createdAt: room.createdAt ?? Date.now(),
    lastUpdated: room.lastUpdated ?? Date.now(),
  };
}

export function getControlUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}?adminKey=${room.adminKey}`;
}

export function getOverlayUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}/overlay?adminKey=${room.adminKey}`;
}

export function loadRoomsState(): RoomsState {
  try {
    const stored = localStorage.getItem('lifeTrackerRooms');
    if (stored) {
      const state = JSON.parse(stored);
      for (const roomId in state.rooms) {
        const room = state.rooms[roomId];
        room.players = room.players.map((p: any) => ({
          ...p,
          poison: p.poison ?? 0,
          experience: p.experience ?? 0,
          energy: p.energy ?? 0,
          commanderDamage: p.commanderDamage ?? {},
          partnerLife: p.partnerLife,
        }));
        room.monarchId = room.monarchId ?? null;
        room.initiativeId = room.initiativeId ?? null;
        room.dungeonProgress = room.dungeonProgress ?? 0;
        room.isDay = room.isDay ?? true;
        room.history = room.history ?? [];
        room.settings = {
          ...(room.settings || {}),
          enableHoldToAdjust: room.settings?.enableHoldToAdjust ?? false,
          enablePartnerTracking: room.settings?.enablePartnerTracking ?? false,
        };
        if (!room.overlayLayout) {
          room.overlayLayout = createDefaultOverlayLayout(room.playerCount);
        }
        if (!room.layoutId) {
          room.layoutId = getDefaultLayout(room.playerCount).id;
        }
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
