/* LifeLink Twitch Extension — viewer runtime for panel + video overlay */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var config = { roomId: '', showNames: true, showCounters: true, theme: 'dark', fontSize: 'medium' };
  var THEMES = ['dark', 'light', 'transparent'];
  var SIZES = ['small', 'medium', 'large', 'xlarge'];

  function pick(list, value, fallback) {
    return list.indexOf(value) === -1 ? fallback : value;
  }

  function applyAppearance() {
    document.body.dataset.theme = config.theme;
    document.body.dataset.size = config.fontSize;
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

    var rows = players.map(function (p) {
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
        LifeLink.escapeHtml(p.color) +
        '"></span>' + who + '</div>' +
        '<span class="life" style="color:' + LifeLink.escapeHtml(p.color) + '">' + p.life + '</span>' +
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
