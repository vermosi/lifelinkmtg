import { supabase } from '@/integrations/supabase/client';
import { Room, Player, HistoryEntry, RoomSettings, OverlayLayout, generateId, createDefaultPlayers, createDefaultOverlayLayout } from './roomUtils';
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

// Convert database format to Room (from rooms_public view - no admin_key)
export function dbToRoom(dbRoom: {
  id: string;
  admin_key?: string; // Optional - not present when querying from rooms_public view
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
  const settings = dbRoom.settings as RoomSettings;
  const players = (dbRoom.players as unknown as Player[]) || [];
  const history = (dbRoom.history as unknown as HistoryEntry[]) || [];
  const overlayLayout = dbRoom.overlay_layout as OverlayLayout | null;
  
  // Try to get admin key from local storage if not provided
  const storedAdminKey = getStoredAdminKey(dbRoom.id);
  
  return {
    id: dbRoom.id,
    adminKey: dbRoom.admin_key || storedAdminKey || '',
    playerCount: players.length as 2 | 3 | 4,
    players: players.map(p => ({
      ...p,
      poison: p.poison ?? 0,
      experience: p.experience ?? 0,
      energy: p.energy ?? 0,
      commanderDamage: p.commanderDamage ?? {},
    })),
    settings: {
      theme: settings?.theme ?? 'dark',
      startingLife: settings?.startingLife ?? 40,
      overlayFontSize: settings?.overlayFontSize ?? 'medium',
      showNamesOnOverlay: settings?.showNamesOnOverlay ?? true,
      showBackgroundCards: settings?.showBackgroundCards ?? true,
      overlayLayout: settings?.overlayLayout ?? 'horizontal',
      simpleTextStyle: settings?.simpleTextStyle ?? false,
    },
    monarchId: dbRoom.monarch ? parseInt(dbRoom.monarch) : null,
    initiativeId: dbRoom.initiative ? parseInt(dbRoom.initiative) : null,
    dungeonProgress: dbRoom.dungeon_progress ?? 0,
    isDay: dbRoom.day_night !== 'night',
    history,
    overlayLayout: overlayLayout ?? createDefaultOverlayLayout(players.length || 4),
    createdAt: new Date(dbRoom.created_at).getTime(),
    lastUpdated: new Date(dbRoom.last_updated).getTime(),
  };
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
export async function createCloudRoom(playerCount: 2 | 3 | 4 = 4): Promise<Room | null> {
  const startingLife = 40;
  const room: Room = {
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

  const { error } = await supabase
    .from('rooms')
    .insert(roomToDbFormat(room));

  if (error) {
    console.error('Error creating cloud room:', error);
    return null;
  }

  // Store admin key locally for future access
  storeAdminKey(room.id, room.adminKey);

  return room;
}

// Get a room from the cloud (using RPC function - no admin_key exposed)
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

// Type for the room data returned by verify_room_admin RPC
interface RoomDataFromRpc {
  id: string;
  players: Player[];
  settings: RoomSettings;
  day_night: string;
  monarch: string | null;
  initiative: string | null;
  dungeon_progress: number;
  overlay_layout: OverlayLayout | null;
  history: HistoryEntry[];
  created_at: string;
  last_updated: string;
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

  const result = data[0] as unknown as { is_admin: boolean; room_data: RoomDataFromRpc | null };
  if (!result.room_data) {
    return { isAdmin: false, room: null };
  }

  // Parse room_data from JSONB
  const roomData = result.room_data;
  const room: Room = {
    id: roomData.id,
    adminKey: '', // Never expose admin key
    playerCount: (roomData.players?.length || 4) as 2 | 3 | 4,
    players: (roomData.players || []).map((p: Player) => ({
      ...p,
      poison: p.poison ?? 0,
      experience: p.experience ?? 0,
      energy: p.energy ?? 0,
      commanderDamage: p.commanderDamage ?? {},
    })),
    settings: {
      theme: roomData.settings?.theme ?? 'dark',
      startingLife: roomData.settings?.startingLife ?? 40,
      overlayFontSize: roomData.settings?.overlayFontSize ?? 'medium',
      showNamesOnOverlay: roomData.settings?.showNamesOnOverlay ?? true,
      showBackgroundCards: roomData.settings?.showBackgroundCards ?? true,
      overlayLayout: roomData.settings?.overlayLayout ?? 'horizontal',
      simpleTextStyle: roomData.settings?.simpleTextStyle ?? false,
    },
    monarchId: roomData.monarch ? parseInt(roomData.monarch) : null,
    initiativeId: roomData.initiative ? parseInt(roomData.initiative) : null,
    dungeonProgress: roomData.dungeon_progress ?? 0,
    isDay: roomData.day_night !== 'night',
    history: roomData.history || [],
    overlayLayout: roomData.overlay_layout ?? createDefaultOverlayLayout(roomData.players?.length || 4),
    createdAt: new Date(roomData.created_at).getTime(),
    lastUpdated: new Date(roomData.last_updated).getTime(),
  };

  return { isAdmin: result.is_admin, room };
}

// Update a room in the cloud (requires admin key verification)
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

// Delete a room from the cloud (requires admin key verification)
export async function deleteCloudRoom(roomId: string, adminKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('delete_room_as_admin', { room_id: roomId, provided_admin_key: adminKey });

  if (error) {
    console.error('Error deleting cloud room:', error);
    return false;
  }

  // Also remove the stored admin key
  removeStoredAdminKey(roomId);

  return data === true;
}


// Get recent rooms (from localStorage cache for now - could be extended with user accounts)
export async function getRecentCloudRooms(): Promise<Room[]> {
  try {
    const stored = localStorage.getItem('lifeTrackerRecentRooms');
    if (!stored) return [];
    
    const recentIds: string[] = JSON.parse(stored);
    
    // Fetch each room individually using RPC (since we can't use IN with RPC)
    const rooms: Room[] = [];
    for (const roomId of recentIds) {
      const room = await getCloudRoom(roomId);
      if (room) rooms.push(room);
    }
    
    // Sort by last updated
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

// Poll for room updates (realtime requires SELECT access which would expose admin_key)
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
      setTimeout(pollRoom, 2000); // Poll every 2 seconds
    }
  };
  
  // Start polling
  pollRoom();

  // Return unsubscribe function
  return () => {
    isActive = false;
  };
}