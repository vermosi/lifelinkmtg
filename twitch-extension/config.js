/* LifeLink Twitch Extension — broadcaster configuration page */
(function () {
  'use strict';

  var input = document.getElementById('room');
  var names = document.getElementById('names');
  var counters = document.getElementById('counters');
  var theme = document.getElementById('theme');
  var size = document.getElementById('size');

  var THEMES = ['dark', 'light', 'transparent'];
  var SIZES = ['small', 'medium', 'large', 'xlarge'];

  function pick(list, value, fallback) {
    return list.indexOf(value) === -1 ? fallback : value;
  }
  var save = document.getElementById('save');
  var test = document.getElementById('test');
  var status = document.getElementById('status');

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = 'status' + (kind ? ' ' + kind : '');
  }

  function currentConfig() {
    return {
      roomId: input.value.trim(),
      showNames: names.checked,
      showCounters: counters.checked,
      theme: pick(THEMES, theme.value, 'dark'),
      fontSize: pick(SIZES, size.value, 'medium'),
    };
  }

  function load() {
    if (!window.Twitch || !window.Twitch.ext) return;
    var segment = window.Twitch.ext.configuration.broadcaster;
    if (!segment || !segment.content) return;
    try {
      var parsed = JSON.parse(segment.content);
      input.value = parsed.roomId || '';
      names.checked = parsed.showNames !== false;
      counters.checked = parsed.showCounters !== false;
      theme.value = pick(THEMES, parsed.theme, 'dark');
      size.value = pick(SIZES, parsed.fontSize, 'medium');
      applyPreview();
    } catch (e) {
      /* ignore malformed config */
    }
  }

  // Live-preview the chosen look on the config page itself.
  function applyPreview() {
    document.body.dataset.theme = pick(THEMES, theme.value, 'dark');
    document.body.dataset.size = pick(SIZES, size.value, 'medium');
  }

  theme.addEventListener('change', applyPreview);
  size.addEventListener('change', applyPreview);
  applyPreview();

  save.addEventListener('click', function () {
    var config = currentConfig();
    if (!LifeLink.isValidRoomId(config.roomId)) {
      setStatus('That room code looks wrong — it should be 4–32 letters or numbers.', 'err');
      return;
    }
    setStatus('Checking the room…');
    LifeLink.fetchRoom(config.roomId).then(function (row) {
      if (!row) {
        setStatus('No active LifeLink room with that code. Create or open the room first.', 'err');
        return;
      }
      if (!window.Twitch || !window.Twitch.ext) {
        setStatus('Room found, but this page must run inside Twitch to save.', 'err');
        return;
      }
      window.Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify(config));
      setStatus('Saved. Your panel and overlay now show room ' + config.roomId + '.', 'ok');
    }).catch(function (err) {
      console.error('LifeLink config save failed', err);
      setStatus('Could not reach LifeLink. Check your connection and try again.', 'err');
    });
  });

  test.addEventListener('click', function () {
    var config = currentConfig();
    if (!LifeLink.isValidRoomId(config.roomId)) {
      setStatus('Enter a room code first.', 'err');
      return;
    }
    setStatus('Testing…');
    LifeLink.fetchRoom(config.roomId).then(function (row) {
      if (!row) setStatus('No active room with that code.', 'err');
      else setStatus('Room found with ' + LifeLink.toPlayers(row).length + ' players.', 'ok');
    }).catch(function () {
      setStatus('Could not reach LifeLink.', 'err');
    });
  });

  if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(load);
    window.Twitch.ext.configuration.onChanged(load);
  } else {
    setStatus('Preview mode — saving only works inside the Twitch configuration view.');
  }
})();
