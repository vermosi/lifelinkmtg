/* LifeLink Twitch Extension — viewer runtime for panel + video overlay */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var config = { roomId: '', showNames: true, showCounters: true, theme: 'dark', fontSize: 'medium', playerColors: [] };
  var THEMES = ['dark', 'light', 'transparent'];
  var SIZES = ['small', 'medium', 'large', 'xlarge'];

  function pick(list, value, fallback) {
    return list.indexOf(value) === -1 ? fallback : value;
  }

  function applyAppearance() {
    document.body.dataset.theme = config.theme;
    document.body.dataset.size = config.fontSize;
    applyResponsive();
  }

  // Reference box the layout was designed against (a standard Twitch panel).
  var HEX = /^#[0-9a-fA-F]{6}$/;

  /** Broadcaster per-seat color overrides; null entries keep the room's own color. */
  function normalizeColors(list) {
    var out = [];
    for (var i = 0; i < 8; i += 1) {
      out.push(Array.isArray(list) && HEX.test(list[i]) ? String(list[i]).toLowerCase() : null);
    }
    return out;
  }

  var BASE_WIDTH = 320;
  var BASE_ROW_HEIGHT = 46;
  var MIN_FIT = 0.6;
  var MAX_FIT = 1.6;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Scales the widget to the live Twitch player / panel box: width drives the
   * type scale, available height divided by the player count keeps every row
   * visible, and very small boxes switch to denser layouts.
   */
  function applyResponsive() {
    var body = document.body;
    var width = window.innerWidth || BASE_WIDTH;
    var height = window.innerHeight || 400;
    var isOverlay = body.classList.contains('overlay');
    var boxWidth = isOverlay ? clamp(width * 0.28, 180, 420) : width;
    var boxHeight = isOverlay ? height * 0.7 : height;
    var playerCount = lastRow ? Math.max(LifeLink.toPlayers(lastRow).length, 1) : 4;

    var widthFit = boxWidth / BASE_WIDTH;
    var heightFit = (boxHeight - 28) / (playerCount * BASE_ROW_HEIGHT);
    var fit = clamp(Math.min(widthFit, heightFit), MIN_FIT, MAX_FIT);

    body.style.setProperty('--ll-fit', fit.toFixed(3));

    var perRow = boxHeight / playerCount;
    body.dataset.density = perRow < 30 || fit <= 0.72 ? 'minimal' : perRow < 44 ? 'tight' : 'comfortable';
    body.dataset.narrow = boxWidth < 240 ? '1' : '0';
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyResponsive, 80);
  });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { applyResponsive(); }).observe(document.documentElement);
  }
  var stop = null;
  var lastRow = null;
  var failures = 0;

  function setState(message) {
    lastRow = null;
    root.innerHTML = '<div class="state">' + LifeLink.escapeHtml(message) + '</div>';
  }

  var HELP_URL = 'https://lifelinkmtg.app/twitch-extension';

  /** Renders an explicit failure banner naming the reason plus quick fixes. */
  function bannerHtml(info, attempts) {
    var fixes = info.fixes.map(function (fix) {
      return '<li>' + LifeLink.escapeHtml(fix) + '</li>';
    }).join('');
    return (
      '<div class="banner" role="alert">' +
      '<div class="banner-title">' + LifeLink.escapeHtml(info.title) + '</div>' +
      '<div class="banner-body">' + LifeLink.escapeHtml(info.body) + '</div>' +
      '<ul class="banner-fixes">' + fixes + '</ul>' +
      '<div class="banner-meta">' +
      '<a class="banner-link" href="' + HELP_URL + '" target="_blank" rel="noopener noreferrer">Setup help</a>' +
      '<span>' + LifeLink.escapeHtml(info.code) + ' · attempt ' + attempts + '</span>' +
      '</div>' +
      '</div>'
    );
  }

  function renderError(err) {
    var info = LifeLink.describeError(err);
    var stale = lastRow ? '<div class="stale">Showing the last known totals.</div>' : '';
    var previous = lastRow ? rowsHtml(lastRow) : '';
    root.innerHTML = bannerHtml(info, failures) + stale + previous;
  }

  function rowsHtml(row) {
    var players = LifeLink.toPlayers(row);

    var rows = players.map(function (p, index) {
      var color = HEX.test(config.playerColors[index] || '') ? config.playerColors[index] : p.color;
      var badges = '';
      if (config.showCounters) {
        if (p.poison > 0) badges += '<span class="badge">☠ ' + p.poison + '</span>';
        if (p.isMonarch) badges += '<span class="badge">Monarch</span>';
        if (p.hasInitiative) badges += '<span class="badge">Initiative</span>';
      }
      var commander = p.commanders.length
        ? '<div class="sub">' + LifeLink.escapeHtml(p.commanders.join(' & ')) + '</div>'
        : '';
      var who = config.showNames
        ? '<div><div class="name">' + LifeLink.escapeHtml(p.name) + '</div>' + commander +
          (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>'
        : '';
      return (
        '<li class="row">' +
        '<div class="who"><span class="dot" style="background:' +
        LifeLink.escapeHtml(color) +
        '"></span>' + who + '</div>' +
        '<span class="life" style="color:' + LifeLink.escapeHtml(color) + '">' + p.life + '</span>' +
        '</li>'
      );
    }).join('');

    return (
      '<ul class="rows">' + rows + '</ul>' +
      '<div class="foot">LifeLink · ' + LifeLink.escapeHtml(row.id) + '</div>'
    );
  }

  function render(row) {
    failures = 0;
    if (!row) {
      renderError(LifeLink.apiError('room_not_found', config.roomId));
      return;
    }
    if (!LifeLink.toPlayers(row).length) {
      setState('Waiting for players…');
      lastRow = row;
      return;
    }
    lastRow = row;
    root.innerHTML = rowsHtml(row);
    applyResponsive();
  }

  function start() {
    if (stop) { stop(); stop = null; }
    failures = 0;
    lastRow = null;
    if (!LifeLink.isValidRoomId(config.roomId)) {
      renderError(LifeLink.apiError('invalid_room_id'));
      return;
    }
    setState('Connecting to room ' + config.roomId + '…');
    stop = LifeLink.pollRoom(config.roomId, 2000, render, function (err) {
      console.error('LifeLink poll failed', err);
      failures += 1;
      renderError(err);
    });
  }

  function applyConfig(raw) {
    if (!raw) return false;
    var parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch (e) { return false; }
    }
    if (!parsed || !LifeLink.isValidRoomId(parsed.roomId)) return false;
    config.roomId = parsed.roomId;
    config.showNames = parsed.showNames !== false;
    config.showCounters = parsed.showCounters !== false;
    config.theme = pick(THEMES, parsed.theme, 'dark');
    config.fontSize = pick(SIZES, parsed.fontSize, 'medium');
    config.playerColors = normalizeColors(parsed.playerColors);
    applyAppearance();
    return true;
  }

  applyAppearance();
  setState('Loading LifeLink…');

  // Preview override: works locally and inside Twitch's test rig.
  var params = new URLSearchParams(window.location.search);
  var previewRoom = params.get('room') || '';

  if (LifeLink.isValidRoomId(previewRoom)) {
    applyConfig({
      roomId: previewRoom,
      showNames: params.get('names') !== '0',
      showCounters: params.get('counters') !== '0',
      theme: params.get('theme'),
      fontSize: params.get('size'),
      playerColors: (params.get('colors') || '').split(',').map(function (c) {
        return c ? '#' + c.replace(/^#/, '') : null;
      }),
    });
    start();
  } else if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(function () {
      var broadcasterSegment = window.Twitch.ext.configuration.broadcaster;
      if (broadcasterSegment && applyConfig(broadcasterSegment.content)) start();
      else setState('No room connected yet. The broadcaster can add a LifeLink room code in the extension configuration.');
    });

    window.Twitch.ext.configuration.onChanged(function () {
      var segment = window.Twitch.ext.configuration.broadcaster;
      if (segment && applyConfig(segment.content)) start();
    });

  } else {
    setState('Add ?room=YOUR_ROOM_CODE to preview this outside Twitch.');
  }

})();
