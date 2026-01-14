import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCloudRoomState } from '@/hooks/useCloudRoomState';
import { cn } from '@/lib/utils';
import { createDefaultOverlayLayout } from '@/lib/roomUtils';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ObsOverlayView() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || undefined;
  const { room, loading } = useCloudRoomState(roomId);

  const config = useMemo(() => {
    const parsedPlayers = Number(searchParams.get('players'));
    const players = Number.isFinite(parsedPlayers) ? clamp(parsedPlayers, 2, 6) : undefined;
    const layout = searchParams.get('layout') || 'free';
    const theme = searchParams.get('theme') || undefined;
    const showNames = searchParams.get('showNames');
    const showCommanderDamage = searchParams.get('showCommanderDamage');
    const showPoison = searchParams.get('showPoison');

    return {
      players,
      layout,
      theme,
      showNames: showNames === null ? undefined : showNames === '1',
      showCommanderDamage: showCommanderDamage === null ? undefined : showCommanderDamage === '1',
      showPoison: showPoison === null ? undefined : showPoison === '1',
    };
  }, [searchParams]);

  if (!roomId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent text-white/70">
        <div className="text-center space-y-2">
          <div className="font-display text-3xl">Overlay Ready</div>
          <div className="text-sm text-white/50">Add ?roomId=XXXX to the URL.</div>
        </div>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent text-white/50">
        <div className="font-display text-3xl">{loading ? 'Loading…' : 'Room not found'}</div>
      </div>
    );
  }

  const effectiveTheme = config.theme ?? room.settings.theme;
  const showNames = config.showNames ?? room.settings.showNamesOnOverlay;
  const showCommanderDamage = config.showCommanderDamage ?? true;
  const showPoison = config.showPoison ?? true;

  const playersToShow = config.players
    ? room.players.slice(0, config.players)
    : room.players;

  const isFreeLayout = config.layout === 'free';
  const isVertical = config.layout === 'vertical';
  const gridColumns = config.layout === '2x2' ? 2 : playersToShow.length <= 2 ? 1 : 2;
  const gridRows = config.layout === '2x2' ? 2 : Math.ceil(playersToShow.length / gridColumns);
  const layoutClass = isFreeLayout
    ? 'relative'
    : isVertical
      ? 'flex flex-col'
      : gridColumns === 1
        ? 'grid grid-cols-1'
        : 'grid grid-cols-2';
  const layoutStyle = isFreeLayout
    ? undefined
    : isVertical
      ? undefined
      : { gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))` };
  const overlayLayout = room.overlayLayout ?? createDefaultOverlayLayout(room.players.length);

  return (
    <div
      className={cn(
        'w-screen h-screen p-4',
        effectiveTheme === 'light' ? 'text-slate-900' : 'text-white'
      )}
      style={{ backgroundColor: 'transparent' }}
    >
      <div className={cn('gap-4 h-full', layoutClass)} style={layoutStyle}>
        {playersToShow.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl px-4 py-3',
              isFreeLayout && 'absolute -translate-x-1/2 -translate-y-1/2',
              effectiveTheme === 'light' ? 'bg-white/70' : 'bg-black/50'
            )}
            style={
              isFreeLayout
                ? {
                    left: `${(overlayLayout.players[player.id]?.x ?? 50)}%`,
                    top: `${(overlayLayout.players[player.id]?.y ?? 50)}%`,
                  }
                : undefined
            }
          >
            {showNames && (
              <div className="text-sm font-semibold" style={{ color: effectiveTheme === 'light' ? '#1f2937' : 'white' }}>
                {player.name}
              </div>
            )}
            <div
              className={cn(
                'font-display leading-none drop-shadow-sm',
                room.settings.overlayFontSize === 'small' && 'text-5xl',
                room.settings.overlayFontSize === 'medium' && 'text-6xl',
                room.settings.overlayFontSize === 'large' && 'text-7xl'
              )}
              style={{ color: effectiveTheme === 'light' ? '#111827' : 'white' }}
            >
              {player.life}
            </div>
            {showPoison && player.poison > 0 && (
              <div className="mt-1 text-xs font-medium text-emerald-400">Poison: {player.poison}</div>
            )}
            {showCommanderDamage && Object.keys(player.commanderDamage).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {room.players
                  .filter((opponent) => opponent.id !== player.id)
                  .map((opponent) => {
                    const damage = player.commanderDamage[opponent.id];
                    if (!damage) return null;
                    return (
                      <div
                        key={opponent.id}
                        className={cn(
                          'text-[11px] px-1.5 py-0.5 rounded-full font-semibold',
                          effectiveTheme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white'
                        )}
                      >
                        {opponent.name}: {damage}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
