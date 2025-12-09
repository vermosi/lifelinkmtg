import { useState, useEffect, useCallback } from 'react';
import { Room, HistoryEntry, OverlayLayout, getRoom, saveRoom, generateId, createDefaultOverlayLayout } from '@/lib/roomUtils';

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
        } catch {}
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

  const addHistoryEntry = useCallback((
    prev: Room,
    playerId: number,
    type: HistoryEntry['type'],
    oldValue: number,
    newValue: number,
    fromPlayerName?: string
  ): HistoryEntry[] => {
    if (oldValue === newValue) return prev.history;
    const player = prev.players.find(p => p.id === playerId);
    const entry: HistoryEntry = {
      id: generateId(8),
      timestamp: Date.now(),
      playerId,
      playerName: player?.name || `Player ${playerId}`,
      type,
      oldValue,
      newValue,
      fromPlayerName,
    };
    return [...prev.history, entry];
  }, []);

  const updateRoom = useCallback((updater: (prev: Room) => Room) => {
    setRoom(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveRoom(updated);
      return updated;
    });
  }, []);

  const updatePlayerLife = useCallback((playerId: number, delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const oldValue = player?.life || 0;
      const newValue = oldValue + delta;
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, life: newValue } : p
        ),
        history: addHistoryEntry(prev, playerId, 'life', oldValue, newValue),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const setPlayerLife = useCallback((playerId: number, life: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const oldValue = player?.life || 0;
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, life } : p
        ),
        history: addHistoryEntry(prev, playerId, 'life', oldValue, life),
      };
    });
  }, [updateRoom, addHistoryEntry]);

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
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const oldValue = player?.poison || 0;
      const newValue = Math.max(0, oldValue + delta);
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, poison: newValue } : p
        ),
        history: addHistoryEntry(prev, playerId, 'poison', oldValue, newValue),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const updatePlayerExperience = useCallback((playerId: number, delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const oldValue = player?.experience || 0;
      const newValue = Math.max(0, oldValue + delta);
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, experience: newValue } : p
        ),
        history: addHistoryEntry(prev, playerId, 'experience', oldValue, newValue),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const updatePlayerEnergy = useCallback((playerId: number, delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const oldValue = player?.energy || 0;
      const newValue = Math.max(0, oldValue + delta);
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, energy: newValue } : p
        ),
        history: addHistoryEntry(prev, playerId, 'energy', oldValue, newValue),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const updateCommanderDamage = useCallback((playerId: number, fromPlayerId: number, delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const fromPlayer = prev.players.find(p => p.id === fromPlayerId);
      const oldValue = player?.commanderDamage[fromPlayerId] || 0;
      const newValue = Math.max(0, oldValue + delta);
      return {
        ...prev,
        players: prev.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            commanderDamage: {
              ...p.commanderDamage,
              [fromPlayerId]: newValue,
            },
          };
        }),
        history: addHistoryEntry(prev, playerId, 'commander', oldValue, newValue, fromPlayer?.name),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const setMonarch = useCallback((playerId: number | null) => {
    updateRoom(prev => {
      let history = prev.history;
      if (playerId !== prev.monarchId && playerId !== null) {
        history = addHistoryEntry(prev, playerId, 'monarch', 0, 1);
      }
      return {
        ...prev,
        monarchId: playerId,
        history,
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const setInitiative = useCallback((playerId: number | null) => {
    updateRoom(prev => {
      let history = prev.history;
      const isNewPlayer = playerId !== prev.initiativeId && playerId !== null;
      if (isNewPlayer) {
        history = addHistoryEntry(prev, playerId, 'initiative', 0, 1);
      }
      return {
        ...prev,
        initiativeId: playerId,
        dungeonProgress: isNewPlayer ? 0 : prev.dungeonProgress,
        history,
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const advanceDungeon = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      dungeonProgress: Math.min(3, prev.dungeonProgress + 1),
    }));
  }, [updateRoom]);

  const toggleDayNight = useCallback(() => {
    updateRoom(prev => {
      const newIsDay = !prev.isDay;
      const entry: HistoryEntry = {
        id: generateId(8),
        timestamp: Date.now(),
        playerId: 0,
        playerName: 'Game',
        type: 'daynight',
        oldValue: prev.isDay ? 1 : 0,
        newValue: newIsDay ? 1 : 0,
      };
      return {
        ...prev,
        isDay: newIsDay,
        history: [...prev.history, entry],
      };
    });
  }, [updateRoom]);

  const updateOverlayLayout = useCallback((layout: OverlayLayout) => {
    updateRoom(prev => ({
      ...prev,
      overlayLayout: layout,
    }));
  }, [updateRoom]);

  const resetOverlayLayout = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      overlayLayout: createDefaultOverlayLayout(prev.playerCount),
    }));
  }, [updateRoom]);

  const resetGame = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p => ({
        ...p,
        life: prev.settings.startingLife,
        poison: 0,
        experience: 0,
        energy: 0,
        commanderDamage: {},
      })),
      monarchId: null,
      initiativeId: null,
      dungeonProgress: 0,
      isDay: true,
      history: [],
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
            experience: 0,
            energy: 0,
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
        monarchId: prev.monarchId && prev.monarchId <= count ? prev.monarchId : null,
        initiativeId: prev.initiativeId && prev.initiativeId <= count ? prev.initiativeId : null,
        overlayLayout: createDefaultOverlayLayout(count),
      };
    });
  }, [updateRoom]);

  const setStartingLife = useCallback((life: 40 | 20) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, startingLife: life },
      players: prev.players.map(p => ({ 
        ...p, 
        life, 
        poison: 0, 
        experience: 0,
        energy: 0,
        commanderDamage: {} 
      })),
      monarchId: null,
      initiativeId: null,
      dungeonProgress: 0,
      isDay: true,
      history: [],
    }));
  }, [updateRoom]);

  const clearHistory = useCallback(() => {
    updateRoom(prev => ({ ...prev, history: [] }));
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
    updatePlayerExperience,
    updatePlayerEnergy,
    updateCommanderDamage,
    setMonarch,
    setInitiative,
    advanceDungeon,
    toggleDayNight,
    updateOverlayLayout,
    resetOverlayLayout,
    resetGame,
    setPlayerCount,
    setStartingLife,
    clearHistory,
  };
}
