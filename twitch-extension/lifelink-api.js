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

  /** Reads a room through the public, read-only RPC. Never exposes admin keys. */
  function fetchRoom(roomId) {
    if (!isValidRoomId(roomId)) {
      return Promise.reject(new Error('invalid_room_id'));
    }
    return fetch(SUPABASE_URL + '/rest/v1/rpc/get_room_public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ room_id_param: roomId }),
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (body) {
          throw new Error('room_fetch_failed_' + res.status + ': ' + body);
        });
      }
      return res.json();
    }).then(function (rows) {
      if (!rows || !rows.length) return null;
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
  };
})(window);
