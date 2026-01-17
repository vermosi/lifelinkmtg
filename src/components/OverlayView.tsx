import { useParams } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCloudRoomState } from '@/hooks/useCloudRoomState';
import { cn } from '@/lib/utils';
import { Skull, Sparkles, Zap, Crown, Shield, Sun, Moon, Move, Lock, Unlock, RotateCcw } from 'lucide-react';
import { DUNGEON_ROOMS, OverlayLayout, OverlayPosition, createDefaultOverlayLayout } from '@/lib/roomUtils';

interface DraggableElementProps {
  id: string;
  position: OverlayPosition;
  onPositionChange: (pos: OverlayPosition) => void;
  isEditMode: boolean;
  children: React.ReactNode;
}

function DraggableElement({ id, position, onPositionChange, isEditMode, children }: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
  }, [isEditMode, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = ((e.clientX - dragStart.current.x) / window.innerWidth) * 100;
    const deltaY = ((e.clientY - dragStart.current.y) / window.innerHeight) * 100;
    const newX = Math.max(5, Math.min(95, initialPos.current.x + deltaX));
    const newY = Math.max(5, Math.min(95, initialPos.current.y + deltaY));
    onPositionChange({ x: newX, y: newY });
  }, [isDragging, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    initialPos.current = { x: position.x, y: position.y };
  }, [isEditMode, position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = ((touch.clientX - dragStart.current.x) / window.innerWidth) * 100;
    const deltaY = ((touch.clientY - dragStart.current.y) / window.innerHeight) * 100;
    const newX = Math.max(5, Math.min(95, initialPos.current.x + deltaX));
    const newY = Math.max(5, Math.min(95, initialPos.current.y + deltaY));
    onPositionChange({ x: newX, y: newY });
  }, [isDragging, onPositionChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = ((e.clientX - dragStart.current.x) / window.innerWidth) * 100;
      const deltaY = ((e.clientY - dragStart.current.y) / window.innerHeight) * 100;
      const newX = Math.max(5, Math.min(95, initialPos.current.x + deltaX));
      const newY = Math.max(5, Math.min(95, initialPos.current.y + deltaY));
      onPositionChange({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = ((touch.clientX - dragStart.current.x) / window.innerWidth) * 100;
      const deltaY = ((touch.clientY - dragStart.current.y) / window.innerHeight) * 100;
      const newX = Math.max(5, Math.min(95, initialPos.current.x + deltaX));
      const newY = Math.max(5, Math.min(95, initialPos.current.y + deltaY));
      onPositionChange({ x: newX, y: newY });
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, onPositionChange]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 transition-shadow',
        isEditMode && 'cursor-move',
        isEditMode && isDragging && 'z-50',
        isEditMode && 'ring-2 ring-dashed ring-white/30 hover:ring-white/60'
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {isEditMode && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
          <Move className="w-3 h-3 inline mr-1" />Drag to move
        </div>
      )}
      {children}
    </div>
  );
}

export function OverlayView() {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading, updateOverlayLayout } = useCloudRoomState(roomId);
  
  const resetOverlayLayout = () => {
    if (room) {
      const { createDefaultOverlayLayout } = require('@/lib/roomUtils');
      updateOverlayLayout(createDefaultOverlayLayout(room.playerCount));
    }
  };
  const [isEditMode, setIsEditMode] = useState(false);

  if (loading || !room) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="font-display text-4xl text-white/30">
          {loading ? 'Loading...' : 'Room not found'}
        </div>
      </div>
    );
  }

  const layout = room.overlayLayout || createDefaultOverlayLayout(room.playerCount);

  const updatePosition = (key: 'dayNight' | 'dungeon', pos: OverlayPosition) => {
    updateOverlayLayout({
      ...layout,
      [key]: pos,
    });
  };

  const updatePlayerPosition = (playerId: number, pos: OverlayPosition) => {
    updateOverlayLayout({
      ...layout,
      players: {
        ...layout.players,
        [playerId]: pos,
      },
    });
  };

  const getFontSize = () => {
    switch (room.settings.overlayFontSize) {
      case 'small': return 'text-4xl';
      case 'large': return 'text-8xl';
      default: return 'text-6xl';
    }
  };

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden"
      style={{ backgroundColor: isEditMode ? 'rgba(0,0,0,0.8)' : 'transparent' }}
    >
      {/* Edit mode toggle */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {isEditMode && (
          <button
            onClick={() => resetOverlayLayout()}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Layout
          </button>
        )}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isEditMode
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
          )}
        >
          {isEditMode ? (
            <>
              <Lock className="w-4 h-4" />
              Lock Layout
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              Edit Layout
            </>
          )}
        </button>
      </div>

      {isEditMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          Drag elements to reposition them for your stream
        </div>
      )}

      {/* Day/Night indicator */}
      <DraggableElement
        id="dayNight"
        position={layout.dayNight}
        onPositionChange={(pos) => updatePosition('dayNight', pos)}
        isEditMode={isEditMode}
      >
        <div 
          className={cn(
            'p-2 rounded-full shadow-lg',
            room.isDay ? 'bg-amber-400' : 'bg-indigo-900'
          )}
        >
          {room.isDay ? (
            <Sun className="w-5 h-5 text-amber-900" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-200" />
          )}
        </div>
      </DraggableElement>

      {/* Initiative dungeon progress */}
      {room.initiativeId && (
        <DraggableElement
          id="dungeon"
          position={layout.dungeon}
          onPositionChange={(pos) => updatePosition('dungeon', pos)}
          isEditMode={isEditMode}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-purple-400" fill="currentColor" />
            <span className="text-sm text-purple-300 font-medium">
              {DUNGEON_ROOMS[room.dungeonProgress]}
            </span>
            <div className="flex gap-1 ml-1">
              {DUNGEON_ROOMS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    idx <= room.dungeonProgress ? 'bg-purple-500' : 'bg-purple-500/30'
                  )}
                />
              ))}
            </div>
          </div>
        </DraggableElement>
      )}

      {/* Player cards */}
      {room.players.map((player) => {
        const playerPos = layout.players[player.id] || { x: 50, y: 85 };
        const useSimpleText = room.settings.simpleTextStyle;
        
        return (
          <DraggableElement
            key={player.id}
            id={`player-${player.id}`}
            position={playerPos}
            onPositionChange={(pos) => updatePlayerPosition(player.id, pos)}
            isEditMode={isEditMode}
          >
            <div
              className={cn(
                'flex flex-col items-center justify-center py-3 px-6 rounded-2xl min-w-[120px] relative',
                !useSimpleText && room.settings.showBackgroundCards && 'backdrop-blur-md'
              )}
              style={{ 
                backgroundColor: !useSimpleText && room.settings.showBackgroundCards 
                  ? `hsl(${player.color} / 0.9)` 
                  : 'transparent' 
              }}
            >
              {/* Status badges */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                {room.monarchId === player.id && (
                  <div className={cn(
                    'p-1 rounded-full',
                    useSimpleText ? 'bg-transparent' : 'bg-black/50'
                  )}>
                    <Crown 
                      className="w-4 h-4 text-yellow-400" 
                      fill="currentColor"
                      style={useSimpleText ? {
                        filter: 'drop-shadow(1px 1px 0 black) drop-shadow(-1px -1px 0 black) drop-shadow(1px -1px 0 black) drop-shadow(-1px 1px 0 black)'
                      } : undefined}
                    />
                  </div>
                )}
                {room.initiativeId === player.id && (
                  <div className={cn(
                    'p-1 rounded-full',
                    useSimpleText ? 'bg-transparent' : 'bg-black/50'
                  )}>
                    <Shield 
                      className="w-4 h-4 text-purple-400" 
                      fill="currentColor"
                      style={useSimpleText ? {
                        filter: 'drop-shadow(1px 1px 0 black) drop-shadow(-1px -1px 0 black) drop-shadow(1px -1px 0 black) drop-shadow(-1px 1px 0 black)'
                      } : undefined}
                    />
                  </div>
                )}
              </div>

              {room.settings.showNamesOnOverlay && (
                <div 
                  className="font-body font-semibold text-base mb-0.5"
                  style={useSimpleText ? {
                    color: 'white',
                    textShadow: '2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 0 2px 0 black, 0 -2px 0 black, 2px 0 0 black, -2px 0 0 black',
                  } : { 
                    color: 'rgba(0,0,0,0.7)' 
                  }}
                >
                  {player.name}
                </div>
              )}
              <div
                className={cn('font-display leading-none', getFontSize())}
                style={useSimpleText ? {
                  color: 'white',
                  textShadow: '3px 3px 0 black, -3px -3px 0 black, 3px -3px 0 black, -3px 3px 0 black, 0 3px 0 black, 0 -3px 0 black, 3px 0 0 black, -3px 0 0 black',
                } : {
                  color: room.settings.showBackgroundCards 
                    ? 'rgba(0,0,0,0.8)' 
                    : `hsl(${player.color})`,
                  textShadow: room.settings.showBackgroundCards 
                    ? 'none'
                    : `0 0 30px hsl(${player.color} / 0.6), 0 2px 4px rgba(0,0,0,0.5)`,
                }}
              >
                {player.life}
              </div>
              {/* Deck/Commander name */}
              {player.deckName && (
                <div 
                  className={cn(
                    'font-body text-xs mt-0.5 px-2 py-0.5 rounded',
                    !useSimpleText && 'bg-black/30'
                  )}
                  style={useSimpleText ? {
                    color: 'white',
                    textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                  } : { 
                    color: 'rgba(255,255,255,0.9)' 
                  }}
                >
                  {player.deckName}
                </div>
              )}

              {/* Counters row */}
              <div className="flex gap-1.5 mt-1.5">
                {player.poison > 0 && (
                  <div className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
                    !useSimpleText && 'bg-black/40'
                  )}>
                    <Skull className="w-3 h-3 text-green-400" style={useSimpleText ? {
                      filter: 'drop-shadow(1px 1px 0 black) drop-shadow(-1px -1px 0 black)'
                    } : undefined} />
                    <span 
                      className="font-display text-xs font-bold"
                      style={useSimpleText ? {
                        color: '#4ade80',
                        textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                      } : { color: '#4ade80' }}
                    >{player.poison}</span>
                  </div>
                )}
                {player.experience > 0 && (
                  <div className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
                    !useSimpleText && 'bg-black/40'
                  )}>
                    <Sparkles className="w-3 h-3 text-yellow-400" style={useSimpleText ? {
                      filter: 'drop-shadow(1px 1px 0 black) drop-shadow(-1px -1px 0 black)'
                    } : undefined} />
                    <span 
                      className="font-display text-xs font-bold"
                      style={useSimpleText ? {
                        color: '#facc15',
                        textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                      } : { color: '#facc15' }}
                    >{player.experience}</span>
                  </div>
                )}
                {player.energy > 0 && (
                  <div className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
                    !useSimpleText && 'bg-black/40'
                  )}>
                    <Zap className="w-3 h-3 text-blue-400" style={useSimpleText ? {
                      filter: 'drop-shadow(1px 1px 0 black) drop-shadow(-1px -1px 0 black)'
                    } : undefined} />
                    <span 
                      className="font-display text-xs font-bold"
                      style={useSimpleText ? {
                        color: '#60a5fa',
                        textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                      } : { color: '#60a5fa' }}
                    >{player.energy}</span>
                  </div>
                )}
              </div>

              {/* Commander damage */}
              {Object.keys(player.commanderDamage).length > 0 && (
                <div className="flex gap-1 mt-1">
                  {room.players.filter(p => p.id !== player.id).map(opp => {
                    const dmg = player.commanderDamage[opp.id];
                    if (!dmg) return null;
                    return (
                      <div
                        key={opp.id}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-display font-bold',
                          useSimpleText && 'bg-transparent'
                        )}
                        style={useSimpleText ? {
                          color: 'white',
                          textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                        } : { 
                          backgroundColor: `hsl(${opp.color})`,
                          color: 'rgba(0,0,0,0.8)',
                        }}
                      >
                        {dmg}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DraggableElement>
        );
      })}
    </div>
  );
}
