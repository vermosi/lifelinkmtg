/* LifeLink Twitch Extension — broadcaster configuration page */
(function () {
  'use strict';

  var input = document.getElementById('room');
  var nameMode = document.getElementById('nameMode');
  var compact = document.getElementById('compact');
  var counterGrid = document.getElementById('counter-grid');
  var countersNone = document.getElementById('counters-none');

  // Secondary counters the broadcaster can surface as badges.
  var COUNTER_OPTIONS = [
    { key: 'poison', label: 'Poison' },
    { key: 'energy', label: 'Energy' },
    { key: 'experience', label: 'Experience' },
    { key: 'storm', label: 'Storm' },
    { key: 'commanderTax', label: 'Commander tax' },
    { key: 'monarch', label: 'Monarch' },
    { key: 'initiative', label: 'Initiative' },
    { key: 'custom', label: 'Custom counters' },
  ];
  var DEFAULT_COUNTERS = { poison: true, monarch: true, initiative: true };

  var counterState = Object.assign({}, DEFAULT_COUNTERS);

  function normalizeCounters(value, fallback) {
    if (!value || typeof value !== 'object') return Object.assign({}, fallback);
    var out = {};
    COUNTER_OPTIONS.forEach(function (option) { out[option.key] = value[option.key] === true; });
    return out;
  }

  function renderCounterGrid() {
    counterGrid.innerHTML = '';
    COUNTER_OPTIONS.forEach(function (option) {
      var label = document.createElement('label');
      label.className = 'counter-toggle';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = counterState[option.key] === true;
      box.addEventListener('change', function () { counterState[option.key] = box.checked; });
      var text = document.createElement('span');
      text.textContent = option.label;
      label.appendChild(box);
      label.appendChild(text);
      counterGrid.appendChild(label);
    });
  }
  var theme = document.getElementById('theme');
  var size = document.getElementById('size');
  var safe = document.getElementById('safe');


  var THEMES = ['dark', 'light', 'transparent'];
  var SIZES = ['small', 'medium', 'large', 'xlarge'];
  var NAME_MODES = ['full', 'initials', 'hidden'];

  function pick(list, value, fallback) {
    return list.indexOf(value) === -1 ? fallback : value;
  }
  var colorGrid = document.getElementById('color-grid');
  var colorsReset = document.getElementById('colors-reset');

  var MAX_SEATS = 8;
  var HEX = /^#[0-9a-fA-F]{6}$/;

  // null = keep the color configured inside LifeLink for that seat.
  var playerColors = new Array(MAX_SEATS).fill(null);
  var roomColors = new Array(MAX_SEATS).fill('#7dd3fc');
  var roomNames = new Array(MAX_SEATS).fill('');

  function normalizeColors(list) {
    var out = new Array(MAX_SEATS).fill(null);
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < MAX_SEATS; i += 1) {
      if (HEX.test(list[i])) out[i] = String(list[i]).toLowerCase();
    }
    return out;
  }

  function renderColorGrid() {
    colorGrid.innerHTML = '';
    for (var i = 0; i < MAX_SEATS; i += 1) {
      (function (index) {
        var seat = document.createElement('div');
        seat.className = 'color-seat';
        seat.dataset.custom = playerColors[index] ? '1' : '0';

        var picker = document.createElement('input');
        picker.type = 'color';
        picker.value = playerColors[index] || roomColors[index];
        picker.setAttribute('aria-label', 'Color for seat ' + (index + 1));
        picker.addEventListener('input', function () {
          playerColors[index] = picker.value.toLowerCase();
          seat.dataset.custom = '1';
        });

        var label = document.createElement('span');
        label.textContent = roomNames[index] || 'Seat ' + (index + 1);

        var clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'clear';
        clear.title = 'Use the room color for this seat';
        clear.setAttribute('aria-label', 'Reset seat ' + (index + 1) + ' to the room color');
        clear.textContent = '\u00d7';
        clear.addEventListener('click', function () {
          playerColors[index] = null;
          picker.value = roomColors[index];
          seat.dataset.custom = '0';
        });

        seat.appendChild(picker);
        seat.appendChild(label);
        seat.appendChild(clear);
        colorGrid.appendChild(seat);
      })(i);
    }
  }

  /** Seeds seat labels and default swatches from the live room, when reachable. */
  function syncRoomSeats(row) {
    var players = LifeLink.toPlayers(row);
    for (var i = 0; i < MAX_SEATS; i += 1) {
      roomNames[i] = players[i] ? players[i].name : '';
      roomColors[i] = players[i] && HEX.test(players[i].color) ? players[i].color.toLowerCase() : '#7dd3fc';
    }
    renderColorGrid();
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
      nameMode: pick(NAME_MODES, nameMode.value, 'full'),
      compact: compact.checked,
      // Kept for older installed viewers that only understand the boolean.
      showNames: nameMode.value !== 'hidden',
      counters: Object.assign({}, counterState),
      // Kept for older installed viewers that only understand the boolean.
      showCounters: COUNTER_OPTIONS.some(function (o) { return counterState[o.key]; }),
      theme: pick(THEMES, theme.value, 'dark'),
      fontSize: pick(SIZES, size.value, 'medium'),
      playerColors: playerColors.slice(0, MAX_SEATS),
    };
  }

  function load() {
    if (!window.Twitch || !window.Twitch.ext) return;
    var segment = window.Twitch.ext.configuration.broadcaster;
    if (!segment || !segment.content) return;
    try {
      var parsed = JSON.parse(segment.content);
      input.value = parsed.roomId || '';
      nameMode.value = pick(NAME_MODES, parsed.nameMode, parsed.showNames === false ? 'hidden' : 'full');
      compact.checked = parsed.compact === true;
      counterState = normalizeCounters(
        parsed.counters,
        parsed.showCounters === false ? {} : DEFAULT_COUNTERS
      );
      renderCounterGrid();
      theme.value = pick(THEMES, parsed.theme, 'dark');
      size.value = pick(SIZES, parsed.fontSize, 'medium');
      playerColors = normalizeColors(parsed.playerColors);
      renderColorGrid();
      applyPreview();
      startMonitor();

    } catch (e) {
      /* ignore malformed config */
    }
  }

  // Live-preview the chosen look on the config page itself.
  function applyPreview() {
    document.body.dataset.theme = pick(THEMES, theme.value, 'dark');
    document.body.dataset.size = pick(SIZES, size.value, 'medium');
    document.body.dataset.compact = compact.checked ? '1' : '0';
  }

  colorsReset.addEventListener('click', function () {
    playerColors = new Array(MAX_SEATS).fill(null);
    renderColorGrid();
    setStatus('Player colors reset to the room defaults. Save to apply.');
  });

  countersNone.addEventListener('click', function () {
    counterState = {};
    renderCounterGrid();
    setStatus('All counter badges hidden. Save to apply.');
  });

  renderColorGrid();
  renderCounterGrid();


  compact.addEventListener('change', applyPreview);
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
      syncRoomSeats(row);
      if (!window.Twitch || !window.Twitch.ext) {
        setStatus('Room found, but this page must run inside Twitch to save.', 'err');
        return;
      }
      window.Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify(config));
      setStatus('Saved. Your panel and overlay now show room ' + config.roomId + '.', 'ok');
    }).catch(function (err) {
      console.error('LifeLink config save failed', err);
      var info = LifeLink.describeError(err);
      setStatus(info.title + ' — ' + info.body, 'err');
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
      syncRoomSeats(row);
      setStatus('Room found with ' + LifeLink.toPlayers(row).length + ' players.', 'ok');
    }).catch(function (err) {
      var info = LifeLink.describeError(err);
      setStatus(info.title + ' — ' + info.body, 'err');
    });
  });

  // ---- Live connection + sync monitor -------------------------------------
  var live = document.getElementById('live');
  var liveTitle = document.getElementById('live-title');
  var liveDetail = document.getElementById('live-detail');
  var stopPolling = null;
  var lastOkAt = null;
  var tickTimer = null;

  function setLive(state, title, detail) {
    live.dataset.state = state;
    liveTitle.textContent = title;
    liveDetail.textContent = detail || '';
  }

  function agoText() {
    if (!lastOkAt) return '';
    var secs = Math.max(0, Math.round((Date.now() - lastOkAt) / 1000));
    if (secs < 2) return 'updated just now';
    if (secs < 60) return 'updated ' + secs + 's ago';
    return 'updated ' + Math.round(secs / 60) + 'm ago';
  }

  function stopMonitor() {
    if (stopPolling) { stopPolling(); stopPolling = null; }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  }

  function startMonitor() {
    stopMonitor();
    lastOkAt = null;
    var roomId = input.value.trim();
    if (!roomId) {
      setLive('idle', 'Enter a room code to check the connection');
      return;
    }
    if (!LifeLink.isValidRoomId(roomId)) {
      setLive('err', 'Invalid room code', 'Room codes are 4–32 letters or numbers, no spaces or symbols.');
      return;
    }
    setLive('checking', 'Connecting to room ' + roomId + '…', 'Checking that the room exists and is live.');
    stopPolling = LifeLink.pollRoom(roomId, 3000, function (row) {
      lastOkAt = Date.now();
      var players = LifeLink.toPlayers(row);
      syncRoomSeats(row);
      setLive(
        'ok',
        'Connected — ' + players.length + (players.length === 1 ? ' player' : ' players'),
        'Room ' + roomId + ' is syncing every 3s · ' + agoText()
      );
    }, function (err) {
      var info = LifeLink.describeError(err);
      var detail = info.body;
      if (lastOkAt) detail += ' Last good sync ' + agoText() + '.';
      setLive('err', info.title, detail);
    });
    tickTimer = setInterval(function () {
      if (live.dataset.state === 'ok' && lastOkAt) {
        liveDetail.textContent = 'Room ' + roomId + ' is syncing every 3s · ' + agoText();
      }
    }, 1000);
  }

  var monitorDebounce = null;
  input.addEventListener('input', function () {
    setLive('checking', 'Waiting for the room code…');
    clearTimeout(monitorDebounce);
    monitorDebounce = setTimeout(startMonitor, 500);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopMonitor();
    else startMonitor();
  });

  startMonitor();


  if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(load);
    window.Twitch.ext.configuration.onChanged(load);
  } else {
    setStatus('Preview mode — saving only works inside the Twitch configuration view.');
  }
})();
