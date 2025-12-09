export interface Player {
  id: number;
  name: string;
  life: number;
  color: string;
  poison: number;
  experience: number;
  energy: number;
  commanderDamage: Record<number, number>;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  playerId: number;
  playerName: string;
  type: 'life' | 'poison' | 'commander' | 'experience' | 'energy' | 'monarch';
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
}

export interface Room {
  id: string;
  adminKey: string;
  playerCount: 2 | 3 | 4;
  players: Player[];
  settings: RoomSettings;
  monarchId: number | null;
  history: HistoryEntry[];
  createdAt: number;
  lastUpdated: number;
}

export interface RoomsState {
  rooms: Record<string, Room>;
  recentRoomIds: string[];
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
    },
    monarchId: null,
    history: [],
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };
}

export function getControlUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}?adminKey=${room.adminKey}`;
}

export function getOverlayUrl(room: Room): string {
  return `${window.location.origin}/room/${room.id}/overlay`;
}

export function loadRoomsState(): RoomsState {
  try {
    const stored = localStorage.getItem('lifeTrackerRooms');
    if (stored) {
      const state = JSON.parse(stored);
      // Migrate old data
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
        room.history = room.history ?? [];
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
  // Keep only last 50 history entries
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
