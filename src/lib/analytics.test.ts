import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerAnalyticsProvider, sanitizeProps, trackEvent } from './analytics';

const CONSENT_KEY = 'lifelink-cookie-consent';

describe('sanitizeProps', () => {
  it('keeps only allow-listed coarse properties', () => {
    expect(sanitizeProps({ player_count: 4, roomId: 'ROOM1', name: 'Alice' } as never)).toEqual({ player_count: 4 });
  });

  it('drops values that could carry identifiers or URLs', () => {
    expect(sanitizeProps({ source: 'https://lifelinkmtg.app/room/ROOM1' } as never)).toEqual({});
    expect(sanitizeProps({ surface: 'x'.repeat(64) } as never)).toEqual({});
    expect(sanitizeProps({ attempt: Number.NaN } as never)).toEqual({});
  });

  it('returns an empty object for no props', () => {
    expect(sanitizeProps()).toEqual({});
  });
});

describe('trackEvent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends nothing without consent', () => {
    const provider = vi.fn();
    const unregister = registerAnalyticsProvider(provider);
    trackEvent('room_created', { player_count: 4 });
    expect(provider).not.toHaveBeenCalled();
    unregister();
  });

  it('sends allow-listed events with sanitized props once consent is given', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    const provider = vi.fn();
    const unregister = registerAnalyticsProvider(provider);
    trackEvent('room_created', { player_count: 4, roomId: 'ROOM1' } as never);
    expect(provider).toHaveBeenCalledWith('room_created', { player_count: 4 });
    unregister();
  });

  it('rejects unknown event names', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    const provider = vi.fn();
    const unregister = registerAnalyticsProvider(provider);
    trackEvent('life_changed' as never);
    expect(provider).not.toHaveBeenCalled();
    unregister();
  });

  it('never throws when the provider fails', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    const unregister = registerAnalyticsProvider(() => {
      throw new Error('provider down');
    });
    expect(() => trackEvent('help_opened')).not.toThrow();
    unregister();
  });
});
