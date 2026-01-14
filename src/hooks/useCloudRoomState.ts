import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Room, HistoryEntry, OverlayLayout, generateId, createDefaultOverlayLayout, GamePreset } from '@/lib/roomUtils';
import { getCloudRoom, updateCloudRoom, subscribeToRoom, addToRecentRooms, getStoredAdminKey } from '@/lib/cloudRoomUtils';

export function useCloudRoomState(roomId: string | undefined) {
  const [searchParams] = useSearchParams();
  // Get admin key from URL first, fall back to locally stored key
  const urlAdminKey = searchParams.get('adminKey') || '';
  const storedAdminKey = roomId ? getStoredAdminKey(roomId) : null;
  const adminKey = urlAdminKey || storedAdminKey || '';
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');

  // Load room from cloud
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const loadRoom = async () => {
      setLoading(true);
      try {
        const cloudRoom = await getCloudRoom(roomId);
        if (cloudRoom) {
          setRoom(cloudRoom);
          addToRecentRooms(roomId);
          lastUpdateRef.current = JSON.stringify(cloudRoom);
        } else {
          setRoom(null);
        }
      } catch (error) {
        console.error('Failed to load room.', error);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (updatedRoom) => {
      const updateStr = JSON.stringify(updatedRoom);
      // Only update if the change came from elsewhere (not our own update)
      if (updateStr !== lastUpdateRef.current) {
        lastUpdateRef.current = updateStr;
        setRoom(updatedRoom);
      }
    });

    return unsubscribe;
  }, [roomId]);

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
    return [...prev.history.slice(-49), entry];
  }, []);

  // Debounced cloud sync (uses adminKey from URL for secure server-side verification)
  const syncToCloud = useCallback((updatedRoom: Room) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setSyncing(true);
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        lastUpdateRef.current = JSON.stringify(updatedRoom);
        await updateCloudRoom(updatedRoom, adminKey);
      } catch (error) {
        console.error('Failed to sync room to cloud.', error);
      } finally {
        setSyncing(false);
      }
    }, 100); // Debounce by 100ms
  }, [adminKey]);

  const updateRoom = useCallback((updater: (prev: Room) => Room) => {
    setRoom(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      syncToCloud(updated);
      return updated;
    });
  }, [syncToCloud]);

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

  const setPlayerDeckName = useCallback((playerId: number, deckName: string) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, deckName } : p
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
        history: [...prev.history.slice(-49), entry],
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

  const setSimpleTextStyle = useCallback((enabled: boolean) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, simpleTextStyle: enabled },
    }));
  }, [updateRoom]);

  const loadPreset = useCallback((preset: GamePreset) => {
    updateRoom(prev => {
      const newPlayerCount = preset.playerCount;
      const newPlayers = preset.players.map((p, i) => ({
        id: i + 1,
        name: p.name,
        life: preset.startingLife,
        color: p.color,
        poison: 0,
        experience: 0,
        energy: 0,
        commanderDamage: {},
      }));

      return {
        ...prev,
        playerCount: newPlayerCount,
        players: newPlayers,
        settings: { ...prev.settings, startingLife: preset.startingLife },
        monarchId: null,
        initiativeId: null,
        dungeonProgress: 0,
        isDay: true,
        history: [],
        overlayLayout: createDefaultOverlayLayout(newPlayerCount),
      };
    });
  }, [updateRoom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    room,
    loading,
    syncing,
    updateRoom,
    updatePlayerLife,
    setPlayerLife,
    setPlayerName,
    setPlayerColor,
    setPlayerDeckName,
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
    loadPreset,
    setSimpleTextStyle,
  };
}
