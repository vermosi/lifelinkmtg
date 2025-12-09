import { useState, useEffect, useCallback } from 'react';
import { Room, Player, getRoom, saveRoom, loadRoomsState } from '@/lib/roomUtils';

export function useRoomState(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const loadedRoom = getRoom(roomId);
    setRoom(loadedRoom);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lifeTrackerRooms' && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          if (state.rooms[roomId]) {
            setRoom(state.rooms[roomId]);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      const currentRoom = getRoom(roomId);
      if (currentRoom && JSON.stringify(currentRoom) !== JSON.stringify(room)) {
        setRoom(currentRoom);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [roomId, room]);

  const updateRoom = useCallback((updater: (prev: Room) => Room) => {
    setRoom(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveRoom(updated);
      return updated;
    });
  }, []);

  const updatePlayerLife = useCallback((playerId: number, delta: number) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, life: p.life + delta } : p
      ),
    }));
  }, [updateRoom]);

  const setPlayerLife = useCallback((playerId: number, life: number) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, life } : p
      ),
    }));
  }, [updateRoom]);

  const setPlayerName = useCallback((playerId: number, name: string) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, name } : p
      ),
    }));
  }, [updateRoom]);

  const setPlayerColor = useCallback((playerId: number, color: string) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, color } : p
      ),
    }));
  }, [updateRoom]);

  const updatePlayerPoison = useCallback((playerId: number, delta: number) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, poison: Math.max(0, p.poison + delta) } : p
      ),
    }));
  }, [updateRoom]);

  const updateCommanderDamage = useCallback((playerId: number, fromPlayerId: number, delta: number) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id !== playerId) return p;
        const currentDamage = p.commanderDamage[fromPlayerId] || 0;
        return {
          ...p,
          commanderDamage: {
            ...p.commanderDamage,
            [fromPlayerId]: Math.max(0, currentDamage + delta),
          },
        };
      }),
    }));
  }, [updateRoom]);

  const resetGame = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p => ({
        ...p,
        life: prev.settings.startingLife,
        poison: 0,
        commanderDamage: {},
      })),
    }));
  }, [updateRoom]);

  const setPlayerCount = useCallback((count: 2 | 3 | 4) => {
    updateRoom(prev => {
      const currentPlayers = prev.players;
      let newPlayers = [...currentPlayers];
      
      const defaultColors = [
        '45 90% 45%',
        '345 75% 40%',
        '270 40% 35%',
        '220 60% 30%',
      ];
      
      if (count > currentPlayers.length) {
        for (let i = currentPlayers.length; i < count; i++) {
          newPlayers.push({
            id: i + 1,
            name: `Player ${i + 1}`,
            life: prev.settings.startingLife,
            color: defaultColors[i],
            poison: 0,
            commanderDamage: {},
          });
        }
      } else {
        newPlayers = newPlayers.slice(0, count);
      }
      
      return {
        ...prev,
        playerCount: count,
        players: newPlayers,
      };
    });
  }, [updateRoom]);

  const setStartingLife = useCallback((life: 40 | 20) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, startingLife: life },
      players: prev.players.map(p => ({ ...p, life, poison: 0, commanderDamage: {} })),
    }));
  }, [updateRoom]);

  return {
    room,
    loading,
    updateRoom,
    updatePlayerLife,
    setPlayerLife,
    setPlayerName,
    setPlayerColor,
    updatePlayerPoison,
    updateCommanderDamage,
    resetGame,
    setPlayerCount,
    setStartingLife,
  };
}
