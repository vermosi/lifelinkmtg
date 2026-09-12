import { describe, expect, it } from 'vitest';
import { buildAdminUrl, stripAdminKeyFromLocation } from './adminKey';

describe('stripAdminKeyFromLocation', () => {
  it('removes the admin key and keeps other params and the hash', () => {
    const result = stripAdminKeyFromLocation('?adminKey=abc123&fit=fill&safe=1', '#players');
    expect(result.search).toBe('?fit=fill&safe=1');
    expect(result.hash).toBe('#players');
    expect(result.changed).toBe(true);
    expect(result.search).not.toContain('abc123');
  });

  it('returns an empty search when the admin key was the only param', () => {
    const result = stripAdminKeyFromLocation('?adminKey=abc123');
    expect(result.search).toBe('');
    expect(result.changed).toBe(true);
  });

  it('is a no-op when no admin key is present', () => {
    expect(stripAdminKeyFromLocation('?fit=fill')).toEqual({ search: '?fit=fill', hash: '', changed: false });
    expect(stripAdminKeyFromLocation('')).toEqual({ search: '', hash: '', changed: false });
  });
});

describe('buildAdminUrl', () => {
  it('reconstructs the private control URL', () => {
    expect(buildAdminUrl('https://lifelinkmtg.app', 'ROOM1', 'key123')).toBe(
      'https://lifelinkmtg.app/room/ROOM1?adminKey=key123'
    );
  });

  it('never duplicates an existing admin key param', () => {
    const url = buildAdminUrl('https://x.app', 'R', 'new', new URLSearchParams('adminKey=old&fit=fill'));
    expect(url).toBe('https://x.app/room/R?fit=fill&adminKey=new');
    expect(url).not.toContain('old');
  });
});
