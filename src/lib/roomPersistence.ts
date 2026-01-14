import { Room } from './roomUtils';

const ROOM_STATE_VERSION = 1;
const STORAGE_PREFIX = 'lifeTrackerRoomState_v1';

interface PersistedRoomState {
  version: number;
  savedAt: number;
  room: Room;
}

export function loadPersistedRoom(roomId: string): Room | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}:${roomId}`);
    if (!stored) return null;
    const parsed: PersistedRoomState = JSON.parse(stored);
    if (parsed.version !== ROOM_STATE_VERSION) return null;
    return parsed.room;
  } catch {
    return null;
  }
}

export function savePersistedRoom(room: Room): void {
  try {
    const payload: PersistedRoomState = {
      version: ROOM_STATE_VERSION,
      savedAt: Date.now(),
      room,
    };
    localStorage.setItem(`${STORAGE_PREFIX}:${room.id}`, JSON.stringify(payload));
  } catch {
    // Ignore persistence errors
  }
}

export function clearPersistedRoom(roomId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}:${roomId}`);
  } catch {
    // Ignore persistence errors
  }
}

export function clearAllPersistedRooms(): void {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore persistence errors
  }
}
