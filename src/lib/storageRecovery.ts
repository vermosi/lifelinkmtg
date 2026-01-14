import { clearAllPersistedRooms } from './roomPersistence';

export function resetLocalState(): void {
  try {
    localStorage.removeItem('lifeTrackerRooms');
    localStorage.removeItem('lifeTrackerAdminKeys');
    localStorage.removeItem('lifeTrackerRecentRooms');
    localStorage.removeItem('lifeTrackerPresets');
    clearAllPersistedRooms();
  } catch {
    // Ignore errors
  }
}
