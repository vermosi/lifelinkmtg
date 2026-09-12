import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Room, HistoryEntry, OverlayLayout, generateId, createDefaultOverlayLayout, GamePreset, Player, PlayerCount, createDefaultPlayer, normalizeRoom, OverlayPresetId, buildOverlayPresetLayout } from '@/lib/roomUtils';
import { getCloudRoom, updateCloudRoom, subscribeToRoom, addToRecentRooms, getStoredAdminKey } from '@/lib/cloudRoomUtils';
import { loadPersistedRoom, savePersistedRoom } from '@/lib/roomPersistence';
import { trackEvent } from '@/lib/analytics';

export interface CloudRoomStateOptions {
  /**
   * Overlay surfaces (OBS Browser Source, embeds) must keep updating at full
   * rate even when the browser reports the document as hidden.
   */
  alwaysActive?: boolean;
}

export function useCloudRoomState(roomId: string | undefined, options: CloudRoomStateOptions = {}) {
  const { alwaysActive = false } = options;
  const [searchParams] = useSearchParams();
  const urlAdminKey = searchParams.get('adminKey') || '';
  const storedAdminKey = roomId ? getStoredAdminKey(roomId) : null;
  const adminKey = urlAdminKey || storedAdminKey || '';

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<string>('');
  const pendingRoomRef = useRef<Room | null>(null);
  const syncAttemptRef = useRef(0);
  const lastLocalWriteAtRef = useRef(0);
  const adminKeyRef = useRef(adminKey);
  adminKeyRef.current = adminKey;

  // Track online/offline so the UI can surface a status indicator.
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Load room from cloud
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const cachedRoom = loadPersistedRoom(roomId);
    if (cachedRoom) {
      setRoom(normalizeRoom(cachedRoom));
      setLoading(false);
    }

    const loadRoom = async () => {
      setLoading(!cachedRoom);
      try {
        const cloudRoom = await getCloudRoom(roomId);
        if (cloudRoom) {
          setRoom(cloudRoom);
          addToRecentRooms(roomId);
          lastUpdateRef.current = JSON.stringify(cloudRoom);
          savePersistedRoom(cloudRoom);
        } else {
          setRoom(cachedRoom ? normalizeRoom(cachedRoom) : null);
        }
      } catch {
        setRoom(cachedRoom ? normalizeRoom(cachedRoom) : null);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId]);

  // Poll for remote updates. Incoming state is ignored whenever a local write
  // is pending or just happened — otherwise a response that left the server
  // before our write landed could clobber the just-tapped life total.
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(
      roomId,
      (updatedRoom) => {
        if (pendingRoomRef.current) return;
        if (Date.now() - lastLocalWriteAtRef.current < 1500) return;
        const updateStr = JSON.stringify(updatedRoom);
        if (updateStr !== lastUpdateRef.current) {
          lastUpdateRef.current = updateStr;
          setRoom(updatedRoom);
          savePersistedRoom(updatedRoom);
        }
      },
      { alwaysActive }
    );

    return unsubscribe;
  }, [roomId, alwaysActive]);


  const addHistoryEntry = useCallback((
    prev: Room,
    playerId: number,
    type: HistoryEntry['type'],
    oldValue: number,
    newValue: number,
    fromPlayerName?: string,
    counterName?: string
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
      counterName,
    };
    return [...prev.history.slice(-49), entry];
  }, []);

  const SYNC_DEBOUNCE_MS = 150;
  const MAX_SYNC_BACKOFF_MS = 15000;

  const performSync = useCallback(async () => {
    const toSync = pendingRoomRef.current;
    if (!toSync) return;
    const key = adminKeyRef.current;
    if (!key) {
      // Read-only viewer: nothing to persist, never claim a failed sync.
      pendingRoomRef.current = null;
      setSyncing(false);
      return;
    }

    setSyncing(true);
    let succeeded = false;
    try {
      succeeded = await updateCloudRoom(toSync, key);
    } catch {
      succeeded = false;
    }

    if (succeeded) {
      // Only drop the pending snapshot if nothing newer arrived meanwhile.
      if (pendingRoomRef.current === toSync) {
        pendingRoomRef.current = null;
      }
      lastUpdateRef.current = JSON.stringify(toSync);
      syncAttemptRef.current = 0;
      setSyncing(false);
      setSyncError(prev => {
        if (prev) trackEvent('sync_recovered');
        return false;
      });
      return;
    }

    // Failure: keep the pending snapshot and retry with bounded backoff.
    setSyncing(false);
    setSyncError(prev => {
      if (!prev) trackEvent('sync_failure');
      return true;
    });
    syncAttemptRef.current = Math.min(syncAttemptRef.current + 1, 6);
    const delay = Math.min(1000 * 2 ** (syncAttemptRef.current - 1), MAX_SYNC_BACKOFF_MS);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      if (pendingRoomRef.current) void performSync();
    }, delay * (0.8 + Math.random() * 0.4));
  }, []);

  const syncToCloud = useCallback((updatedRoom: Room) => {
    pendingRoomRef.current = updatedRoom;
    lastLocalWriteAtRef.current = Date.now();
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    if (adminKeyRef.current) setSyncing(true);
    updateTimeoutRef.current = setTimeout(() => {
      updateTimeoutRef.current = null;
      void performSync();
    }, SYNC_DEBOUNCE_MS);
  }, [performSync]);

  /** Manual "try again" for the unsynced-changes indicator. */
  const retrySync = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    syncAttemptRef.current = 0;
    void performSync();
  }, [performSync]);

  // Retry as soon as connectivity returns.
  useEffect(() => {
    const onReconnect = () => {
      if (pendingRoomRef.current) retrySync();
    };
    window.addEventListener('online', onReconnect);
    return () => window.removeEventListener('online', onReconnect);
  }, [retrySync]);

  // Flush any pending debounced sync before the tab is hidden or closed so
  // last-second setting changes (colors, preset, name visibility, layout drags)
  // aren't lost on refresh. The pending snapshot is NOT cleared here — only a
  // confirmed successful write clears it.
  useEffect(() => {
    const flush = () => {
      if (!pendingRoomRef.current || !adminKeyRef.current) return;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      void performSync();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [performSync]);

  const updateRoom = useCallback((updater: (prev: Room) => Room) => {
    setRoom(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      // Keep the legacy top-level counter mirrors in step with `counters` so
      // panels/overlays reading either shape stay consistent between syncs.
      const updated: Room = {
        ...next,
        players: next.players.map(p => ({
          ...p,
          poison: p.counters.poison,
          energy: p.counters.energy,
          experience: p.counters.experience,
        })),
      };
      syncToCloud(updated);
      savePersistedRoom(updated);
      return updated;
    });
  }, [syncToCloud]);



  // ============= LIFE MANAGEMENT =============

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

  const undoLastLifeChange = useCallback(() => {
    updateRoom(prev => {
      const lastLifeEntryIndex = [...prev.history].reverse().findIndex(entry => entry.type === 'life');
      if (lastLifeEntryIndex === -1) return prev;

      const reverseIndex = prev.history.length - 1 - lastLifeEntryIndex;
      const entry = prev.history[reverseIndex];
      const updatedPlayers = prev.players.map(p =>
        p.id === entry.playerId ? { ...p, life: entry.oldValue } : p
      );
      const updatedHistory = prev.history.filter((_, index) => index !== reverseIndex);

      return {
        ...prev,
        players: updatedPlayers,
        history: updatedHistory,
      };
    });
  }, [updateRoom]);

  // ============= PLAYER MANAGEMENT =============

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

  const setPlayerCommanders = useCallback((playerId: number, commanders: string[]) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, commanders: commanders.slice(0, 2) } : p
      ),
    }));
  }, [updateRoom]);

  // ============= COUNTER MANAGEMENT =============

  const updateCounter = useCallback((playerId: number, counterType: keyof Player['counters'], delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      const currentValue = player.counters[counterType];
      if (typeof currentValue === 'boolean') return prev;

      const oldValue = currentValue as number;
      const newValue = Math.max(0, oldValue + delta);

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? {
            ...p,
            counters: { ...p.counters, [counterType]: newValue }
          } : p
        ),
        history: addHistoryEntry(prev, playerId, counterType as HistoryEntry['type'], oldValue, newValue),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const setCounter = useCallback((playerId: number, counterType: keyof Player['counters'], value: number | boolean) => {
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? {
          ...p,
          counters: { ...p.counters, [counterType]: value }
        } : p
      ),
    }));
  }, [updateRoom]);

  const toggleMonarch = useCallback((playerId: number) => {
    updateRoom(prev => {
      const isCurrentlyMonarch = prev.players.find(p => p.id === playerId)?.counters.isMonarch;
      return {
        ...prev,
        players: prev.players.map(p => ({
          ...p,
          counters: {
            ...p.counters,
            isMonarch: p.id === playerId ? !isCurrentlyMonarch : false
          }
        })),
        monarchId: isCurrentlyMonarch ? null : playerId,
        history: !isCurrentlyMonarch
          ? addHistoryEntry(prev, playerId, 'monarch', 0, 1)
          : prev.history,
      };
    });
  }, [updateRoom, addHistoryEntry]);

  const toggleInitiative = useCallback((playerId: number) => {
    updateRoom(prev => {
      const hasInitiative = prev.players.find(p => p.id === playerId)?.counters.hasInitiative;
      return {
        ...prev,
        players: prev.players.map(p => ({
          ...p,
          counters: {
            ...p.counters,
            hasInitiative: p.id === playerId ? !hasInitiative : false
          }
        })),
        initiativeId: hasInitiative ? null : playerId,
        dungeonProgress: hasInitiative ? prev.dungeonProgress : 0,
        history: !hasInitiative
          ? addHistoryEntry(prev, playerId, 'initiative', 0, 1)
          : prev.history,
      };
    });
  }, [updateRoom, addHistoryEntry]);

  // ============= COMMANDER DAMAGE =============

  const updateCommanderDamage = useCallback((playerId: number, fromPlayerId: number, commanderIndex: number, delta: number) => {
    updateRoom(prev => {
      const player = prev.players.find(p => p.id === playerId);
      const fromPlayer = prev.players.find(p => p.id === fromPlayerId);
      const key = `${fromPlayerId}-${commanderIndex}`;
      const oldValue = player?.commanderDamageReceived[key] || 0;
      const newValue = Math.max(0, oldValue + delta);

      return {
        ...prev,
        players: prev.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            commanderDamageReceived: {
              ...p.commanderDamageReceived,
              [key]: newValue,
            },
          };
        }),
        history: addHistoryEntry(prev, playerId, 'commander', oldValue, newValue, fromPlayer?.name),
      };
    });
  }, [updateRoom, addHistoryEntry]);

  // ============= TURN & TIMER MANAGEMENT =============

  const nextTurn = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      activePlayerIndex: (prev.activePlayerIndex + 1) % prev.players.length,
      turnNumber: prev.activePlayerIndex === prev.players.length - 1 ? prev.turnNumber + 1 : prev.turnNumber,
    }));
  }, [updateRoom]);

  const previousTurn = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      activePlayerIndex: prev.activePlayerIndex === 0 ? prev.players.length - 1 : prev.activePlayerIndex - 1,
      turnNumber: prev.activePlayerIndex === 0 ? Math.max(1, prev.turnNumber - 1) : prev.turnNumber,
    }));
  }, [updateRoom]);

  const setActivePlayer = useCallback((index: number) => {
    updateRoom(prev => ({
      ...prev,
      activePlayerIndex: Math.max(0, Math.min(prev.players.length - 1, index)),
    }));
  }, [updateRoom]);

  const toggleGameTimer = useCallback(() => {
    updateRoom(prev => {
      const timer = prev.gameTimer;
      if (timer.running) {
        const elapsed = timer.startedAt ? timer.elapsedMs + (Date.now() - timer.startedAt) : timer.elapsedMs;
        return {
          ...prev,
          gameTimer: { running: false, elapsedMs: elapsed, startedAt: null },
        };
      } else {
        return {
          ...prev,
          gameTimer: { running: true, elapsedMs: timer.elapsedMs, startedAt: Date.now() },
        };
      }
    });
  }, [updateRoom]);

  const resetGameTimer = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      gameTimer: { running: false, elapsedMs: 0, startedAt: null },
    }));
  }, [updateRoom]);

  // ============= GAME MANAGEMENT =============

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

  const resetGame = useCallback(() => {
    trackEvent('game_reset');
    updateRoom(prev => ({
      ...prev,
      players: prev.players.map(p => ({
        ...p,
        life: prev.settings.startingLife,
        counters: {
          poison: 0,
          energy: 0,
          experience: 0,
          storm: 0,
          commanderTax: 0,
          isMonarch: false,
          hasInitiative: false,
          custom: [],
        },
        commanderDamageReceived: {},
      })),
      activePlayerIndex: 0,
      turnNumber: 1,
      gameTimer: { running: false, elapsedMs: 0, startedAt: null },
      monarchId: null,
      initiativeId: null,
      dungeonProgress: 0,
      isDay: true,
      history: [],
    }));
  }, [updateRoom]);

  const setPlayerCount = useCallback((count: PlayerCount) => {
    updateRoom(prev => {
      const currentPlayers = prev.players;
      let newPlayers = [...currentPlayers];

      if (count > currentPlayers.length) {
        for (let i = currentPlayers.length; i < count; i++) {
          newPlayers.push(createDefaultPlayer(i, prev.settings.startingLife));
        }
      } else {
        newPlayers = newPlayers.slice(0, count);
      }

      return {
        ...prev,
        playerCount: count,
        players: newPlayers,
        activePlayerIndex: Math.min(prev.activePlayerIndex, count - 1),
        monarchId: prev.monarchId && prev.monarchId <= count ? prev.monarchId : null,
        initiativeId: prev.initiativeId && prev.initiativeId <= count ? prev.initiativeId : null,
        overlayLayout: createDefaultOverlayLayout(count),
      };
    });
  }, [updateRoom]);

  const setStartingLife = useCallback((life: 40 | 20 | 30 | 25) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, startingLife: life },
    }));
  }, [updateRoom]);

  const updateOverlayLayout = useCallback((layout: OverlayLayout) => {
    updateRoom(prev => ({
      ...prev,
      overlayLayout: layout,
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

  const setHoldToAdjust = useCallback((enabled: boolean) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, enableHoldToAdjust: enabled },
    }));
  }, [updateRoom]);

  const setStreamerMode = useCallback((enabled: boolean) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, streamerMode: enabled },
    }));
  }, [updateRoom]);

  const setTextScale = useCallback((scale: 'normal' | 'large' | 'extra-large') => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, textScale: scale },
    }));
  }, [updateRoom]);

  const setOverlayFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, overlayFontSize: size },
    }));
  }, [updateRoom]);

  const setOverlayFontFamily = useCallback((family: 'bebas' | 'inter' | 'roboto' | 'oswald' | 'anton') => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, overlayFontFamily: family },
    }));
  }, [updateRoom]);

  const setShowNamesOnOverlay = useCallback((show: boolean) => {
    updateRoom(prev => ({
      ...prev,
      settings: { ...prev.settings, showNamesOnOverlay: show },
    }));
  }, [updateRoom]);

  const setOverlayColors = useCallback((colors: { bg?: string | null; text?: string | null }) => {
    updateRoom(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...(colors.bg !== undefined ? { overlayBgColor: colors.bg ?? undefined } : {}),
        ...(colors.text !== undefined ? { overlayTextColor: colors.text ?? undefined } : {}),
      },
    }));
  }, [updateRoom]);

  const applyOverlayPreset = useCallback((preset: OverlayPresetId) => {
    updateRoom(prev => ({
      ...prev,
      overlayLayout: buildOverlayPresetLayout(preset, prev.playerCount),
      settings: { ...prev.settings, overlayPreset: preset },
    }));
  }, [updateRoom]);

  // Restore overlay to the room's baseline: default layout for player count,
  // no preset, no color overrides, names visible.
  const resetOverlayDefaults = useCallback(() => {
    updateRoom(prev => ({
      ...prev,
      overlayLayout: createDefaultOverlayLayout(prev.playerCount),
      settings: {
        ...prev.settings,
        overlayPreset: undefined,
        overlayBgColor: undefined,
        overlayTextColor: undefined,
        showNamesOnOverlay: true,
      },
    }));
  }, [updateRoom]);

  const loadPreset = useCallback((preset: GamePreset) => {
    updateRoom(prev => {
      const newPlayerCount = preset.playerCount;
      const newPlayers = preset.players.map((p, i) => ({
        ...createDefaultPlayer(i, preset.startingLife),
        name: p.name,
        color: p.color,
        commanders: p.commanders || [],
      }));

      return {
        ...prev,
        playerCount: newPlayerCount,
        players: newPlayers,
        settings: { ...prev.settings, startingLife: preset.startingLife, streamerMode: preset.streamerMode },
        layoutId: preset.layoutId,
        activePlayerIndex: 0,
        turnNumber: 1,
        gameTimer: { running: false, elapsedMs: 0, startedAt: null },
        monarchId: null,
        initiativeId: null,
        dungeonProgress: 0,
        isDay: true,
        history: [],
        overlayLayout: createDefaultOverlayLayout(newPlayerCount),
      };
    });
  }, [updateRoom]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const syncStatus: 'offline' | 'error' | 'syncing' | 'online' = !isOnline
    ? 'offline'
    : syncError
    ? 'error'
    : syncing
    ? 'syncing'
    : 'online';

  return {
    room,
    loading,
    syncing,
    syncStatus,
    retrySync,
    hasUnsyncedChanges: syncError,
    updateRoom,
    // Life
    updatePlayerLife,
    setPlayerLife,
    undoLastLifeChange,
    // Player
    setPlayerName,
    setPlayerColor,
    setPlayerCommanders,
    // Counters
    updateCounter,
    setCounter,
    toggleMonarch,
    toggleInitiative,
    // Commander damage
    updateCommanderDamage,
    // Turn/Timer
    nextTurn,
    previousTurn,
    setActivePlayer,
    toggleGameTimer,
    resetGameTimer,
    // Game
    advanceDungeon,
    toggleDayNight,
    resetGame,
    setPlayerCount,
    setStartingLife,
    updateOverlayLayout,
    clearHistory,
    // Settings
    setSimpleTextStyle,
    setHoldToAdjust,
    setStreamerMode,
    setTextScale,
    setOverlayFontSize,
    setOverlayFontFamily,
    setShowNamesOnOverlay,
    setOverlayColors,
    applyOverlayPreset,
    resetOverlayDefaults,
    loadPreset,
  };
}
