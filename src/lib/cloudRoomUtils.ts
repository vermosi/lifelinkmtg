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

// Convert database format to Room
export function dbToRoom(dbRoom: {
  id: string;
  admin_key: string;
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
  
  return {
    id: dbRoom.id,
    adminKey: dbRoom.admin_key,
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

  return room;
}

// Get a room from the cloud
export async function getCloudRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching cloud room:', error);
    return null;
  }

  if (!data) return null;

  return dbToRoom(data);
}

// Update a room in the cloud
export async function updateCloudRoom(room: Room): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .update(roomToDbFormat(room))
    .eq('id', room.id);

  if (error) {
    console.error('Error updating cloud room:', error);
    return false;
  }

  return true;
}

// Delete a room from the cloud
export async function deleteCloudRoom(roomId: string): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('Error deleting cloud room:', error);
    return false;
  }

  return true;
}

// Get recent rooms (from localStorage cache for now - could be extended with user accounts)
export async function getRecentCloudRooms(): Promise<Room[]> {
  try {
    const stored = localStorage.getItem('lifeTrackerRecentRooms');
    if (!stored) return [];
    
    const recentIds: string[] = JSON.parse(stored);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .in('id', recentIds)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching recent rooms:', error);
      return [];
    }

    return (data || []).map(dbToRoom);
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

// Subscribe to room changes
export function subscribeToRoom(
  roomId: string, 
  onUpdate: (room: Room) => void
) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          const room = dbToRoom(payload.new as any);
          onUpdate(room);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
