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
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  playerId: number;
  playerName: string;
  type: 'life' | 'poison' | 'commander' | 'experience' | 'energy' | 'monarch' | 'initiative' | 'daynight';
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

export interface Room {
  id: string;
  adminKey: string;
  playerCount: 2 | 3 | 4;
  players: Player[];
  settings: RoomSettings;
  monarchId: number | null;
  initiativeId: number | null;
  dungeonProgress: number;
  isDay: boolean;
  history: HistoryEntry[];
  overlayLayout: OverlayLayout | null;
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
  playerCount: 2 | 3 | 4;
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

export function createDefaultPlayers(count: 2 | 3 | 4, startingLife: number): Player[] {
  const defaultColors = [
    '45 90% 45%',
    '345 75% 40%',
    '270 40% 35%',
    '220 60% 30%',
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    life: startingLife,
    color: defaultColors[i],
    poison: 0,
    experience: 0,
    energy: 0,
    commanderDamage: {},
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

export function createRoom(playerCount: 2 | 3 | 4 = 4): Room {
  const startingLife = 40;
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
      enableHoldToAdjust: false,
    },
    monarchId: null,
    initiativeId: null,
    dungeonProgress: 0,
    isDay: true,
    history: [],
    overlayLayout: createDefaultOverlayLayout(playerCount),
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };
}

export function normalizeRoom(room: Room): Room {
  const validPlayerCounts: Array<Room['playerCount']> = [2, 3, 4];
  const basePlayers = Array.isArray(room.players) ? room.players : [];
  const inferredCount = validPlayerCounts.includes(room.playerCount)
    ? room.playerCount
    : (validPlayerCounts.includes(basePlayers.length as Room['playerCount'])
      ? (basePlayers.length as Room['playerCount'])
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
    createdAt: room.createdAt ?? Date.now(),
    lastUpdated: room.lastUpdated ?? Date.now(),
  };
}

export function getControlUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}?adminKey=${room.adminKey}`;
}

export function getOverlayUrl(room: Room): string {
  return `${window.location.origin}/overlay?roomId=${room.id}`;
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
        }));
        room.monarchId = room.monarchId ?? null;
        room.initiativeId = room.initiativeId ?? null;
        room.dungeonProgress = room.dungeonProgress ?? 0;
        room.isDay = room.isDay ?? true;
        room.history = room.history ?? [];
        room.settings = {
          ...(room.settings || {}),
          enableHoldToAdjust: room.settings?.enableHoldToAdjust ?? false,
        };
        if (!room.overlayLayout) {
          room.overlayLayout = createDefaultOverlayLayout(room.playerCount);
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
