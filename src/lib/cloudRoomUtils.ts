import { supabase } from '@/integrations/supabase/client';
import { Room, Player, HistoryEntry, RoomSettings, OverlayLayout, generateId, createDefaultPlayers, createDefaultOverlayLayout, PlayerCount, LAYOUTS, getDefaultLayout, normalizeRoom, createDefaultPlayer } from './roomUtils';
import type { Json } from '@/integrations/supabase/types';

// Convert Room to database format
export function roomToDbFormat(room: Room) {
  return {
    id: room.id,
    admin_key: room.adminKey,
    settings: room.settings as unknown as Json,
    players: room.players as unknown as Json,
    day_night: room.isDay ? 'day' : 'night',
    monarch: room.monarchId?.toString() ?? null,
    initiative: room.initiativeId?.toString() ?? null,
    dungeon_progress: room.dungeonProgress,
    overlay_layout: room.overlayLayout as unknown as Json,
    history: room.history as unknown as Json,
  };
}

// Convert database format to Room
export function dbToRoom(dbRoom: {
  id: string;
  admin_key?: string;
  settings: unknown;
  players: unknown;
  day_night: string | null;
  monarch: string | null;
  initiative: string | null;
  dungeon_progress: number;
  overlay_layout: unknown;
  history: unknown;
  created_at: string;
  last_updated: string;
}): Room {
  const settings = dbRoom.settings as any;
  const players = (dbRoom.players as unknown as any[]) || [];
  const history = (dbRoom.history as unknown as HistoryEntry[]) || [];
  const overlayLayout = dbRoom.overlay_layout as OverlayLayout | null;

  const storedAdminKey = getStoredAdminKey(dbRoom.id);
  const playerCount = (players.length || 4) as PlayerCount;

  // Create a raw room object and normalize it
  const rawRoom: Room = {
    id: dbRoom.id,
    adminKey: dbRoom.admin_key || storedAdminKey || '',
    playerCount,
    players: players as Player[],
    settings: settings as RoomSettings,
    activePlayerIndex: (settings as any)?.activePlayerIndex ?? 0,
    turnNumber: (settings as any)?.turnNumber ?? 1,
    gameTimer: (settings as any)?.gameTimer ?? { running: false, elapsedMs: 0, startedAt: null },
    monarchId: dbRoom.monarch ? parseInt(dbRoom.monarch) : null,
    initiativeId: dbRoom.initiative ? parseInt(dbRoom.initiative) : null,
    dungeonProgress: dbRoom.dungeon_progress ?? 0,
    isDay: dbRoom.day_night !== 'night',
    history,
    overlayLayout: overlayLayout ?? createDefaultOverlayLayout(playerCount),
    layoutId: (dbRoom as any).layout_id ?? getDefaultLayout(playerCount).id,
    createdAt: new Date(dbRoom.created_at).getTime(),
    lastUpdated: new Date(dbRoom.last_updated).getTime(),
  };

  return normalizeRoom(rawRoom);
}

// Store admin key locally for a room
export function storeAdminKey(roomId: string, adminKey: string): void {
  try {
    const stored = localStorage.getItem('lifeTrackerAdminKeys');
    const keys: Record<string, string> = stored ? JSON.parse(stored) : {};
    keys[roomId] = adminKey;
    localStorage.setItem('lifeTrackerAdminKeys', JSON.stringify(keys));
  } catch {
    // Ignore errors
  }
}

// Get stored admin key for a room
export function getStoredAdminKey(roomId: string): string | null {
  try {
    const stored = localStorage.getItem('lifeTrackerAdminKeys');
    if (!stored) return null;
    const keys: Record<string, string> = JSON.parse(stored);
    return keys[roomId] || null;
  } catch {
    return null;
  }
}

// Remove stored admin key for a room
export function removeStoredAdminKey(roomId: string): void {
  try {
    const stored = localStorage.getItem('lifeTrackerAdminKeys');
    if (!stored) return;
    const keys: Record<string, string> = JSON.parse(stored);
    delete keys[roomId];
    localStorage.setItem('lifeTrackerAdminKeys', JSON.stringify(keys));
  } catch {
    // Ignore errors
  }
}

// Create a new room in the cloud
export async function createCloudRoom(playerCount: PlayerCount = 4, layoutId?: string): Promise<Room | null> {
  const startingLife = 40;
  const layout = layoutId
    ? LAYOUTS.find(l => l.id === layoutId) || getDefaultLayout(playerCount)
    : getDefaultLayout(playerCount);

  const room: Room = {
    id: generateId(6),
    adminKey: generateId(12),
    playerCount,
    players: createDefaultPlayers(playerCount, startingLife),
    settings: {
      theme: 'dark',
      startingLife,
      overlayFontSize: 'medium',
      overlayFontFamily: 'bebas',
      showNamesOnOverlay: true,
      showBackgroundCards: true,
      overlayLayout: 'horizontal',
      simpleTextStyle: false,
      enableHoldToAdjust: true,
      enablePartnerTracking: layout.hasPartner,
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

  const { error } = await supabase
    .from('rooms')
    .insert(roomToDbFormat(room));

  if (error) {
    console.error('Error creating cloud room:', error);
    return null;
  }

  storeAdminKey(room.id, room.adminKey);
  return room;
}

// Get a room from the cloud
export async function getCloudRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .rpc('get_room_public', { room_id_param: roomId });

  if (error) {
    console.error('Error fetching cloud room:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row = data[0];
  return dbToRoom({
    id: row.id,
    settings: row.settings,
    players: row.players,
    day_night: row.day_night,
    monarch: row.monarch,
    initiative: row.initiative,
    dungeon_progress: row.dungeon_progress,
    overlay_layout: row.overlay_layout,
    history: row.history,
    created_at: row.created_at,
    last_updated: row.last_updated,
  });
}

// Verify admin key server-side and get room data
export async function verifyRoomAdmin(roomId: string, adminKey: string): Promise<{ isAdmin: boolean; room: Room | null }> {
  const { data, error } = await supabase
    .rpc('verify_room_admin', { room_id: roomId, provided_admin_key: adminKey });

  if (error) {
    console.error('Error verifying admin:', error);
    return { isAdmin: false, room: null };
  }

  if (!data || data.length === 0) {
    return { isAdmin: false, room: null };
  }

  const result = data[0] as unknown as { is_admin: boolean; room_data: any | null };
  if (!result.room_data) {
    return { isAdmin: false, room: null };
  }

  const roomData = result.room_data;
  const playerCount = (roomData.players?.length || 4) as PlayerCount;

  const rawRoom: Room = {
    id: roomData.id,
    adminKey: '',
    playerCount,
    players: roomData.players || [],
    settings: roomData.settings,
    activePlayerIndex: roomData.activePlayerIndex ?? 0,
    turnNumber: roomData.turnNumber ?? 1,
    gameTimer: roomData.gameTimer ?? { running: false, elapsedMs: 0, startedAt: null },
    monarchId: roomData.monarch ? parseInt(roomData.monarch) : null,
    initiativeId: roomData.initiative ? parseInt(roomData.initiative) : null,
    dungeonProgress: roomData.dungeon_progress ?? 0,
    isDay: roomData.day_night !== 'night',
    history: roomData.history || [],
    overlayLayout: roomData.overlay_layout ?? createDefaultOverlayLayout(playerCount),
    layoutId: roomData.layout_id ?? getDefaultLayout(playerCount).id,
    createdAt: new Date(roomData.created_at).getTime(),
    lastUpdated: new Date(roomData.last_updated).getTime(),
  };

  return { isAdmin: result.is_admin, room: normalizeRoom(rawRoom) };
}

// Update a room in the cloud
export async function updateCloudRoom(room: Room, adminKey: string): Promise<boolean> {
  const roomData = {
    players: JSON.stringify(room.players),
    settings: JSON.stringify(room.settings),
    day_night: room.isDay ? 'day' : 'night',
    monarch: room.monarchId?.toString() ?? null,
    initiative: room.initiativeId?.toString() ?? null,
    dungeon_progress: room.dungeonProgress,
    overlay_layout: room.overlayLayout as unknown as Json,
    history: room.history as unknown as Json,
  };

  const { data, error } = await supabase
    .rpc('update_room_as_admin', {
      room_id: room.id,
      provided_admin_key: adminKey,
      room_data: roomData as unknown as Json
    });

  if (error) {
    console.error('Error updating cloud room:', error);
    return false;
  }

  return data === true;
}

// Delete a room from the cloud
export async function deleteCloudRoom(roomId: string, adminKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('delete_room_as_admin', { room_id: roomId, provided_admin_key: adminKey });

  if (error) {
    console.error('Error deleting cloud room:', error);
    return false;
  }

  removeStoredAdminKey(roomId);
  return data === true;
}

// Get recent rooms
export async function getRecentCloudRooms(): Promise<Room[]> {
  try {
    const stored = localStorage.getItem('lifeTrackerRecentRooms');
    if (!stored) return [];

    const recentIds: string[] = JSON.parse(stored);
    const rooms: Room[] = [];

    for (const roomId of recentIds) {
      const room = await getCloudRoom(roomId);
      if (room) rooms.push(room);
    }

    return rooms.sort((a, b) => b.lastUpdated - a.lastUpdated);
  } catch {
    return [];
  }
}

// Save room ID to recent list
export function addToRecentRooms(roomId: string): void {
  try {
    const stored = localStorage.getItem('lifeTrackerRecentRooms');
    let recentIds: string[] = stored ? JSON.parse(stored) : [];

    recentIds = [roomId, ...recentIds.filter(id => id !== roomId)].slice(0, 10);
    localStorage.setItem('lifeTrackerRecentRooms', JSON.stringify(recentIds));
  } catch {
    // Ignore errors
  }
}

// Remove room from recent list
export function removeFromRecentRooms(roomId: string): void {
  try {
    const stored = localStorage.getItem('lifeTrackerRecentRooms');
    if (!stored) return;

    let recentIds: string[] = JSON.parse(stored);
    recentIds = recentIds.filter(id => id !== roomId);
    localStorage.setItem('lifeTrackerRecentRooms', JSON.stringify(recentIds));
  } catch {
    // Ignore errors
  }
}

// Poll for room updates
export function subscribeToRoom(roomId: string, onUpdate: (room: Room) => void) {
  let lastUpdated: number | null = null;
  let isActive = true;

  const pollRoom = async () => {
    if (!isActive) return;

    try {
      const room = await getCloudRoom(roomId);
      if (room && room.lastUpdated !== lastUpdated) {
        lastUpdated = room.lastUpdated;
        onUpdate(room);
      }
    } catch (error) {
      console.error('Error polling room:', error);
    }

    if (isActive) {
      setTimeout(pollRoom, 2000);
    }
  };

  pollRoom();

  return () => {
    isActive = false;
  };
}
