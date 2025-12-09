export interface Player {
  id: number;
  name: string;
  life: number;
  color: string;
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
  createdAt: number;
  lastUpdated: number;
}

export interface RoomsState {
  rooms: Record<string, Room>;
  recentRoomIds: string[];
}

const PLAYER_COLORS = [
  '45 100% 55%',   // Gold/White
  '200 100% 50%',  // Blue
  '0 0% 40%',      // Gray/Black
  '0 80% 55%',     // Red
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
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    life: startingLife,
    color: PLAYER_COLORS[i],
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
      return JSON.parse(stored);
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
  state.rooms[room.id] = room;
  
  // Update recent rooms list
  state.recentRoomIds = [
    room.id,
    ...state.recentRoomIds.filter(id => id !== room.id)
  ].slice(0, 10);
  
  saveRoomsState(state);
  
  // Dispatch storage event for other windows
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
