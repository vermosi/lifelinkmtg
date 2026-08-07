import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCloudRoom, subscribeToRoom } from '@/lib/cloudRoomUtils';
import { Room } from '@/lib/roomUtils';

type EmbedTheme = 'dark' | 'light' | 'transparent';

const THEMES: Record<EmbedTheme, { shell: string; card: string; label: string; value: string }> = {
  dark: {
    shell: 'bg-background text-foreground',
    card: 'bg-card/80 border-border',
    label: 'text-muted-foreground',
    value: 'text-foreground',
  },
  light: {
    shell: 'bg-secondary text-secondary-foreground',
    card: 'bg-background/90 border-border',
    label: 'text-muted-foreground',
    value: 'text-foreground',
  },
  transparent: {
    shell: 'bg-transparent text-foreground',
    card: 'bg-card/60 border-border/60 backdrop-blur-sm',
    label: 'text-muted-foreground',
    value: 'text-foreground',
  },
};

function isTheme(value: string | null): value is EmbedTheme {
  return value === 'dark' || value === 'light' || value === 'transparent';
}

/**
 * Read-only, iframe-first scoreboard sized for Twitch panels / extensions and
 * any embed on a site. No admin key, no controls, no OBS setup required.
 */
export function EmbedWidget() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const themeParam = searchParams.get('theme');
  const theme = isTheme(themeParam) ? themeParam : 'dark';
  const compact = searchParams.get('compact') === '1';
  const showCounters = searchParams.get('counters') !== '0';
  const styles = THEMES[theme];

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      setFailed(true);
      return;
    }

    let active = true;

    getCloudRoom(roomId)
      .then((loaded) => {
        if (!active) return;
        setRoom(loaded);
        setFailed(!loaded);
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));

    const unsubscribe = subscribeToRoom(roomId, (updated) => {
      if (!active) return;
      setRoom(updated);
      setFailed(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [roomId]);

  const players = useMemo(() => room?.players ?? [], [room]);

  if (loading) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${styles.shell}`}>
        <p className="text-sm text-muted-foreground">Loading life totals…</p>
      </div>
    );
  }

  if (failed || !room) {
    return (
      <div className={`flex h-screen w-full items-center justify-center px-4 text-center ${styles.shell}`}>
        <p className="text-sm text-muted-foreground">
          Room not found. Check the room code in the embed URL.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full flex-col gap-2 overflow-hidden p-2 ${styles.shell}`}>
      <ul className="flex flex-1 flex-col gap-1.5 overflow-hidden" aria-label="Player life totals">
        {players.map((player) => {
          const counters = player.counters;
          const extras = showCounters
            ? [
                counters.poison > 0 ? `${counters.poison} poison` : null,
                counters.energy > 0 ? `${counters.energy} energy` : null,
                counters.experience > 0 ? `${counters.experience} XP` : null,
                counters.isMonarch ? 'Monarch' : null,
                counters.hasInitiative ? 'Initiative' : null,
              ].filter(Boolean)
            : [];

          return (
            <li
              key={player.id}
              className={`flex min-h-0 max-h-24 flex-1 items-center justify-between gap-3 rounded-lg border px-3 py-2 ${styles.card}`}
            >
              <div className="min-w-0">
                <p className={`truncate font-semibold leading-tight ${styles.value} ${compact ? 'text-sm' : 'text-base'}`}>
                  {player.name}
                </p>
                {!compact && extras.length > 0 && (
                  <p className={`truncate text-[11px] leading-tight ${styles.label}`}>{extras.join(' · ')}</p>
                )}
              </div>
              <span
                className={`tabular-nums font-bold leading-none ${styles.value} ${compact ? 'text-2xl' : 'text-3xl'}`}
                style={{ color: player.color }}
              >
                {player.life}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`shrink-0 text-center text-[10px] tracking-wide ${styles.label}`}>
        LifeLink · {room.id}
      </p>
    </div>
  );
}
