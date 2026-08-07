/* LifeLink Twitch Extension — shared API helpers (no build step, plain ES5-ish JS) */
(function (global) {
  'use strict';

  // Publishable (anon) credentials — safe to ship in client code.
  var SUPABASE_URL = 'https://qswjlzfcznlnepilmgtp.supabase.co';
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzd2psemZjem5sbmVwaWxtZ3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNTk0MzIsImV4cCI6MjA4MDgzNTQzMn0.S1cMAFqI-Xnv1XnP6WdA60DLRf5iHVlFfHY6UZOLbSw';

  var ROOM_ID_RE = /^[A-Za-z0-9]{4,32}$/;

  function isValidRoomId(id) {
    return typeof id === 'string' && ROOM_ID_RE.test(id);
  }

  var REQUEST_TIMEOUT_MS = 8000;

  /** Error carrying a machine-readable reason the UI can explain to viewers. */
  function apiError(code, detail) {
    var err = new Error(detail ? code + ': ' + detail : code);
    err.code = code;
    err.detail = detail || '';
    return err;
  }

  /** Reads a room through the public, read-only RPC. Never exposes admin keys. */
  function fetchRoom(roomId) {
    if (!isValidRoomId(roomId)) {
      return Promise.reject(apiError('invalid_room_id'));
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      if (controller) controller.abort();
    }, REQUEST_TIMEOUT_MS);

    return fetch(SUPABASE_URL + '/rest/v1/rpc/get_room_public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ room_id_param: roomId }),
      signal: controller ? controller.signal : undefined,
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) {
        return res.text().then(function (body) {
          throw apiError('server_error', res.status + ' ' + body);
        });
      }
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      if (timedOut || (err && err.name === 'AbortError')) throw apiError('timeout');
      throw apiError('network_error', err && err.message);
    }).then(function (rows) {
      if (!rows || !rows.length) throw apiError('room_not_found', roomId);
      return rows[0];
    });
  }

  /** Normalises the RPC payload into a simple list of players. */
  function toPlayers(row) {
    if (!row) return [];
    var players = row.players;
    if (typeof players === 'string') {
      try { players = JSON.parse(players); } catch (e) { players = []; }
    }
    if (!Array.isArray(players)) return [];
    return players.map(function (p, i) {
      var counters = p.counters || {};
      return {
        id: p.id != null ? p.id : i,
        name: p.name || 'Player ' + (i + 1),
        life: typeof p.life === 'number' ? p.life : 0,
        color: p.color || '#7dd3fc',
        commanders: Array.isArray(p.commanders) ? p.commanders.filter(Boolean) : [],
        poison: counters.poison || p.poison || 0,
        energy: counters.energy || p.energy || 0,
        experience: counters.experience || p.experience || 0,
        storm: counters.storm || 0,
        commanderTax: counters.commanderTax || 0,
        custom: Array.isArray(counters.custom)
          ? counters.custom
              .filter(function (c) { return c && c.name; })
              .map(function (c) { return { name: String(c.name), value: Number(c.value) || 0 }; })
          : [],
        isMonarch: !!counters.isMonarch,
        hasInitiative: !!counters.hasInitiative,
      };
    });
  }

  /** Escapes text before it touches innerHTML. */
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ERROR_COPY = {
    invalid_room_id: {
      title: 'Invalid room code',
      body: 'The saved code is not a valid LifeLink room code (4-32 letters or numbers).',
      fixes: [
        'Broadcaster: open the extension configuration and paste the code from the LifeLink Share tab.',
      ],
    },
    room_not_found: {
      title: 'Room not found',
      body: 'No active LifeLink room matches this code. Rooms are deleted 24h after their last update.',
      fixes: [
        'Broadcaster: reopen the room in LifeLink, or create a new one and save the new code.',
      ],
    },
    timeout: {
      title: 'Connection timed out',
      body: 'LifeLink did not answer in time. Retrying automatically.',
      fixes: [
        'Check your internet connection.',
        'Broadcaster: make sure lifelinkmtg.app and the LifeLink data domain are allowed in the extension URL-fetching list.',
      ],
    },
    network_error: {
      title: 'Cannot reach LifeLink',
      body: 'The request was blocked or the network is offline. Retrying automatically.',
      fixes: [
        'Check your internet connection or disable blockers for twitch.tv.',
        'Broadcaster: confirm the extension allowlist includes the LifeLink data domain.',
      ],
    },
    server_error: {
      title: 'LifeLink returned an error',
      body: 'The life totals service responded with an error. Retrying automatically.',
      fixes: ['Wait a moment — this usually clears on its own.', 'If it persists, check status at lifelinkmtg.app.'],
    },
    unknown: {
      title: 'Connection failed',
      body: 'Something went wrong while loading life totals. Retrying automatically.',
      fixes: ['Reload the panel or refresh the Twitch page.'],
    },
  };

  /** Maps an error to viewer-friendly copy plus quick fixes. */
  function describeError(err) {
    var code = (err && err.code) || 'unknown';
    var copy = ERROR_COPY[code] || ERROR_COPY.unknown;
    return {
      code: code,
      title: copy.title,
      body: copy.body,
      fixes: copy.fixes,
      detail: (err && err.detail) || '',
    };
  }

  /**
   * Polls a room on an interval with backoff on repeated failures.
   * Returns a stop() function.
   */
  function pollRoom(roomId, intervalMs, onData, onError) {
    var stopped = false;
    var failures = 0;
    var timer = null;

    function schedule(delay) {
      if (stopped) return;
      timer = setTimeout(tick, delay);
    }

    function tick() {
      fetchRoom(roomId).then(function (row) {
        failures = 0;
        if (!stopped) onData(row);
        schedule(intervalMs);
      }).catch(function (err) {
        failures += 1;
        if (!stopped && onError) onError(err);
        schedule(Math.min(intervalMs * Math.pow(2, failures), 30000));
      });
    }

    tick();

    return function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }

  global.LifeLink = {
    isValidRoomId: isValidRoomId,
    fetchRoom: fetchRoom,
    toPlayers: toPlayers,
    escapeHtml: escapeHtml,
    pollRoom: pollRoom,
    apiError: apiError,
    describeError: describeError,
  };
})(window);
