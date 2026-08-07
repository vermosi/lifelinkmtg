/* LifeLink Twitch Extension — viewer runtime for panel + video overlay */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var config = { roomId: '', showNames: true, showCounters: true };
  var stop = null;

  function setState(message) {
    root.innerHTML = '<div class="state">' + LifeLink.escapeHtml(message) + '</div>';
  }

  function render(row) {
    if (!row) {
      setState('That room is no longer active. Rooms are removed 24h after their last update.');
      return;
    }
    var players = LifeLink.toPlayers(row);
    if (!players.length) {
      setState('Waiting for players…');
      return;
    }

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

    root.innerHTML =
      '<ul class="rows">' + rows + '</ul>' +
      '<div class="foot">LifeLink · ' + LifeLink.escapeHtml(row.id) + '</div>';
  }

  function start() {
    if (stop) { stop(); stop = null; }
    if (!LifeLink.isValidRoomId(config.roomId)) {
      setState('No room connected yet. The broadcaster can add a LifeLink room code in the extension configuration.');
      return;
    }
    setState('Connecting to room ' + config.roomId + '…');
    stop = LifeLink.pollRoom(config.roomId, 2000, render, function (err) {
      console.error('LifeLink poll failed', err);
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
    return true;
  }

  setState('Loading LifeLink…');

  // Preview override: works locally and inside Twitch's test rig.
  var params = new URLSearchParams(window.location.search);
  var previewRoom = params.get('room') || '';

  if (LifeLink.isValidRoomId(previewRoom)) {
    applyConfig({
      roomId: previewRoom,
      showNames: params.get('names') !== '0',
      showCounters: params.get('counters') !== '0',
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
