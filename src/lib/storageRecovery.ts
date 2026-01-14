import { clearAllPersistedRooms } from './roomPersistence';

export function resetLocalState(): void {
  try {
    const explicitKeys = [
      'lifeTrackerRooms',
      'lifeTrackerAdminKeys',
      'lifeTrackerRecentRooms',
      'lifeTrackerPresets',
    ];
    explicitKeys.forEach((key) => localStorage.removeItem(key));

    const prefixes = ['lifeTracker', 'lifeTrackerRoomState_v1', 'sb-', 'supabase'];
    Object.keys(localStorage).forEach((key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });
    clearAllPersistedRooms();
  } catch {
    // Ignore errors
  }
}
