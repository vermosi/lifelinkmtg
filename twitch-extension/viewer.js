/* LifeLink Twitch Extension — viewer runtime for panel + video overlay */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var config = { roomId: '', nameMode: 'full', compact: false, showNames: true, showCounters: true, counters: { poison: true, monarch: true, initiative: true }, theme: 'dark', fontSize: 'medium', safeArea: 'small', playerColors: [], diagnostics: false };
  var THEMES = ['dark', 'light', 'transparent'];
  var SIZES = ['small', 'medium', 'large', 'xlarge'];
  // Safe-area inset as a fraction of the live frame width/height.
  var SAFE_AREAS = { none: 0, small: 0.025, medium: 0.05, large: 0.08 };
  var SAFE_KEYS = ['none', 'small', 'medium', 'large'];
  var NAME_MODES = ['full', 'initials', 'hidden'];

  var COUNTER_KEYS = ['poison', 'energy', 'experience', 'storm', 'commanderTax', 'monarch', 'initiative', 'custom'];
  var DEFAULT_COUNTERS = { poison: true, monarch: true, initiative: true };

  function normalizeCounters(value, fallback) {
    if (!value || typeof value !== 'object') return Object.assign({}, fallback);
    var out = {};
    COUNTER_KEYS.forEach(function (key) { out[key] = value[key] === true; });
    return out;
  }

  function badge(label, value) {
    return '<span class="badge">' + LifeLink.escapeHtml(label) + ' ' + LifeLink.escapeHtml(String(value)) + '</span>';
  }

  /** Badges for the counters the broadcaster enabled, skipping zero values. */
  function badgesHtml(p) {
    var on = config.counters;
    var out = '';
    if (on.poison && p.poison > 0) out += badge('\u2620', p.poison);
    if (on.energy && p.energy > 0) out += badge('\u26a1', p.energy);
    if (on.experience && p.experience > 0) out += badge('XP', p.experience);
    if (on.storm && p.storm > 0) out += badge('Storm', p.storm);
    if (on.commanderTax && p.commanderTax > 0) out += badge('Tax', p.commanderTax);
    if (on.monarch && p.isMonarch) out += '<span class="badge">Monarch</span>';
    if (on.initiative && p.hasInitiative) out += '<span class="badge">Initiative</span>';
    if (on.custom && p.custom) {
      p.custom.forEach(function (counter) {
        if (counter.value) out += badge(counter.name, counter.value);
      });
    }
    return out;
  }

  /** "Alice Green" -> "AG"; falls back to the first two characters. */
  function toInitials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function pick(list, value, fallback) {
    return list.indexOf(value) === -1 ? fallback : value;
  }

  function applyAppearance() {
    document.body.dataset.theme = config.theme;
    document.body.dataset.size = config.fontSize;
    document.body.dataset.compact = config.compact ? '1' : '0';
    document.body.dataset.safe = config.safeArea;

    invalidateResponsive();
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
   * Preset layouts tuned to the boxes Twitch actually gives an extension:
   * the fixed 320px panel column, the standard 16:9 video overlay, tall
   * sidebar-style overlays, bottom strips, ultrawide/theatre players and the
   * narrow mobile player. Each preset says how much of the frame the widget
   * may occupy and how dense its rows should be.
   */
  var LAYOUT_PRESETS = {
    panel: {
      label: 'Panel column (320px)',
      widthRatio: 1, heightRatio: 1, maxWidth: 340, minWidth: 200,
      maxFit: 1.2, densityBias: 0,
    },
    overlayCorner: {
      label: 'Video overlay — corner card (16:9)',
      widthRatio: 0.28, heightRatio: 0.7, maxWidth: 420, minWidth: 180,
      maxFit: 1.6, densityBias: 0,
    },
    overlaySidebar: {
      label: 'Video overlay — tall sidebar',
      widthRatio: 0.22, heightRatio: 0.94, maxWidth: 360, minWidth: 170,
      maxFit: 1.4, densityBias: 0,
    },
    overlayStrip: {
      label: 'Video overlay — bottom strip',
      widthRatio: 0.96, heightRatio: 0.24, maxWidth: 1600, minWidth: 240,
      maxFit: 1.2, densityBias: 1,
    },
    ultrawide: {
      label: 'Ultrawide / theatre player',
      widthRatio: 0.2, heightRatio: 0.66, maxWidth: 380, minWidth: 180,
      maxFit: 1.5, densityBias: 0,
    },
    mobile: {
      label: 'Mobile / narrow player',
      widthRatio: 0.92, heightRatio: 0.6, maxWidth: 420, minWidth: 160,
      maxFit: 1.1, densityBias: 1,
    },
  };
  var PRESET_KEYS = ['auto', 'panel', 'overlayCorner', 'overlaySidebar', 'overlayStrip', 'ultrawide', 'mobile'];

  /**
   * Picks the preset that matches the live Twitch box: panels always use the
   * column layout, overlays branch on aspect ratio and size so a theatre-mode
   * ultrawide, a short bottom strip and a phone player each get a layout that
   * was designed for that shape.
   */
  function detectPreset(width, height, isOverlay) {
    if (!isOverlay) return 'panel';
    var aspect = width / Math.max(height, 1);
    if (width < 520) return 'mobile';
    if (height < 260) return 'overlayStrip';
    if (aspect >= 2.1) return 'ultrawide';
    if (aspect <= 1.4) return 'overlaySidebar';
    return 'overlayCorner';
  }

  function resolvePreset(width, height, isOverlay) {
    var chosen = config.layoutPreset;
    if (chosen === 'auto' || !LAYOUT_PRESETS[chosen]) chosen = detectPreset(width, height, isOverlay);
    return chosen;
  }

  // Cache of the last inputs/outputs so repeated resize ticks do no DOM work.
  var lastMetrics = null;
  var lastApplied = { fit: '', density: '', narrow: '', safeX: -1, safeY: -1, preset: '' };
  // Last full resize decision, surfaced by the diagnostics readout.
  var lastDecision = null;
  var resizeEvents = 0;
  var recomputes = 0;

  /**
   * Scales the widget to the live Twitch player / panel box: the matched preset
   * defines the layout box, width drives the type scale, available height
   * divided by the player count keeps every row visible, and very small boxes
   * switch to denser layouts.
   *
   * Cheap to call repeatedly — it reads layout once, bails when nothing that
   * affects the result changed, and only writes the properties that differ.
   */
  function applyResponsive() {
    var body = document.body;
    var width = window.innerWidth || BASE_WIDTH;
    var height = window.innerHeight || 400;
    var isOverlay = body.classList.contains('overlay');
    var playerCount = lastRow ? Math.max(LifeLink.toPlayers(lastRow).length, 1) : 4;

    var signature = width + 'x' + height + '|' + playerCount + '|' + config.safeArea + '|' +
      (config.compact ? 1 : 0) + '|' + config.layoutPreset;
    if (signature === lastMetrics) return;
    lastMetrics = signature;
    recomputes += 1;

    // Safe-area inset: a percentage of the live frame, so the widget keeps clear
    // of Twitch chrome and letterboxing on any aspect ratio.
    var pct = SAFE_AREAS[config.safeArea] || 0;
    var safeX = Math.round(width * pct);
    var safeY = Math.round(height * pct);

    var innerWidth = Math.max(width - safeX * 2, 120);
    var innerHeight = Math.max(height - safeY * 2, 120);

    var presetKey = resolvePreset(width, height, isOverlay);
    var preset = LAYOUT_PRESETS[presetKey];
    var boxWidth = clamp(innerWidth * preset.widthRatio, Math.min(preset.minWidth, innerWidth), preset.maxWidth);
    var boxHeight = Math.max(innerHeight * preset.heightRatio, 100);

    var widthFit = boxWidth / BASE_WIDTH;
    var heightFit = (boxHeight - 28) / (playerCount * BASE_ROW_HEIGHT);
    var rawFit = Math.min(widthFit, heightFit);
    var fit = clamp(rawFit, MIN_FIT, Math.min(MAX_FIT, preset.maxFit)).toFixed(3);

    var perRow = boxHeight / playerCount;
    var density = perRow < 30 || Number(fit) <= 0.72 ? 'minimal' : perRow < 44 ? 'tight' : 'comfortable';
    var densityReason = perRow < 30
      ? 'row height < 30px'
      : Number(fit) <= 0.72
        ? 'scale <= 0.72'
        : perRow < 44
          ? 'row height < 44px'
          : 'room to breathe';
    if (preset.densityBias && density === 'comfortable') {
      density = 'tight';
      densityReason = presetKey + ' preset prefers tight rows';
    }
    if (config.compact && density === 'comfortable') {
      density = 'tight';
      densityReason = 'compact mode forces tight';
    }
    var narrow = boxWidth < 240 ? '1' : '0';


    lastDecision = {
      mode: isOverlay ? 'video overlay' : 'panel',
      preset: preset.label + (config.layoutPreset === 'auto' ? ' (auto-matched)' : ' (forced)'),
      frame: Math.round(width) + '×' + Math.round(height),
      safe: config.safeArea + ' (' + Math.round(pct * 1000) / 10 + '% → ' + safeX + '×' + safeY + 'px)',
      box: Math.round(boxWidth) + '×' + Math.round(boxHeight),
      players: playerCount,
      perRow: Math.round(perRow) + 'px / row',
      widthFit: widthFit.toFixed(3),
      heightFit: heightFit.toFixed(3),
      limiter: widthFit <= heightFit ? 'width' : 'height',
      clamped: rawFit < MIN_FIT ? 'clamped up to min ' + MIN_FIT : rawFit > MAX_FIT ? 'clamped down to max ' + MAX_FIT : 'within ' + MIN_FIT + '–' + MAX_FIT,
      fit: fit,
      density: density,
      densityReason: densityReason,
      narrow: narrow === '1' ? 'yes (box < 240px)' : 'no',
      at: new Date(),
    };

    // Batched writes — skip anything that is already correct to avoid style thrash.
    if (safeX !== lastApplied.safeX) {
      body.style.setProperty('--ll-safe-x', safeX + 'px');
      lastApplied.safeX = safeX;
    }
    if (safeY !== lastApplied.safeY) {
      body.style.setProperty('--ll-safe-y', safeY + 'px');
      lastApplied.safeY = safeY;
    }
    if (fit !== lastApplied.fit) {
      body.style.setProperty('--ll-fit', fit);
      lastApplied.fit = fit;
    }
    if (density !== lastApplied.density) {
      body.dataset.density = density;
      lastApplied.density = density;
    }
    if (narrow !== lastApplied.narrow) {
      body.dataset.narrow = narrow;
      lastApplied.narrow = narrow;
    }

    renderDiagnostics();
  }

  /* ---------------- diagnostics readout ---------------- */

  var diagEl = null;

  function diagRow(label, value) {
    return '<div class="diag-row"><span>' + LifeLink.escapeHtml(label) + '</span><b>' +
      LifeLink.escapeHtml(String(value)) + '</b></div>';
  }

  /**
   * Explains, in plain language, the resize decision the widget just made so a
   * broadcaster can tell whether the layout is width-limited, height-limited or
   * clamped before asking for help.
   */
  function renderDiagnostics() {
    if (!config.diagnostics) {
      if (diagEl) { diagEl.remove(); diagEl = null; }
      return;
    }
    if (!diagEl) {
      diagEl = document.createElement('div');
      diagEl.className = 'diag';
      diagEl.setAttribute('role', 'status');
      diagEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(diagEl);
    }
    var d = lastDecision;
    if (!d) {
      diagEl.innerHTML = '<div class="diag-title">Layout diagnostics</div>' +
        '<div class="diag-row"><span>Waiting for first measurement…</span></div>';
      return;
    }
    diagEl.innerHTML =
      '<div class="diag-title">Layout diagnostics <span class="diag-hint">press D to hide</span></div>' +
      diagRow('View', d.mode) +
      diagRow('Frame', d.frame) +
      diagRow('Safe area', d.safe) +
      diagRow('Layout box', d.box) +
      diagRow('Players / rows', d.players + ' (' + d.perRow + ')') +
      diagRow('Width fit', d.widthFit) +
      diagRow('Height fit', d.heightFit) +
      diagRow('Scale used', d.fit + ' — ' + d.limiter + '-limited, ' + d.clamped) +
      diagRow('Breakpoint', d.density + ' — ' + d.densityReason) +
      diagRow('Narrow mode', d.narrow) +
      diagRow('Resizes / recomputes', resizeEvents + ' / ' + recomputes) +
      diagRow('Last decision', d.at.toLocaleTimeString());
  }

  function setDiagnostics(on) {
    config.diagnostics = !!on;
    renderDiagnostics();
  }

  // Local escape hatch: press "D" to toggle the readout without re-saving config.
  window.addEventListener('keydown', function (event) {
    if ((event.key === 'd' || event.key === 'D') && !event.metaKey && !event.ctrlKey && !event.altKey) {
      setDiagnostics(!config.diagnostics);
    }
  });

  /** Forces the next scheduled pass to recompute (config or player count changed). */
  function invalidateResponsive() {
    lastMetrics = null;
  }

  /**
   * Rapid Twitch layout changes (theatre mode, panel drags, player resizes) fire
   * dozens of events per second. Coalesce them into one measurement per frame,
   * plus a trailing pass once the box settles.
   */
  var rafId = null;
  var settleTimer = null;

  function runResponsive() {
    rafId = null;
    applyResponsive();
  }

  function scheduleResponsive() {
    resizeEvents += 1;
    if (rafId === null) {
      rafId = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(runResponsive)
        : setTimeout(runResponsive, 16);
    }
    document.body.dataset.resizing = '1';
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      settleTimer = null;
      document.body.dataset.resizing = '0';
      applyResponsive();
    }, 120);
  }

  window.addEventListener('resize', scheduleResponsive, { passive: true });
  window.addEventListener('orientationchange', scheduleResponsive, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(scheduleResponsive).observe(document.documentElement);
  }
  // Twitch tells the viewer about player size / theatre-mode changes directly.
  if (window.Twitch && window.Twitch.ext && window.Twitch.ext.onContext) {
    window.Twitch.ext.onContext(function () { scheduleResponsive(); });
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
      var badges = badgesHtml(p);
      var showCommander = config.nameMode === 'full';
      var commander = showCommander && p.commanders.length
        ? '<div class="sub">' + LifeLink.escapeHtml(p.commanders.join(' & ')) + '</div>'
        : '';
      var label = config.nameMode === 'initials' ? toInitials(p.name) : p.name;
      var who = config.nameMode !== 'hidden'
        ? '<div><div class="name">' + LifeLink.escapeHtml(label) + '</div>' + commander +
          (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>'
        : (badges ? '<div><div class="badges">' + badges + '</div></div>' : '');
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
    invalidateResponsive();
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
    config.nameMode = pick(NAME_MODES, parsed.nameMode, parsed.showNames === false ? 'hidden' : 'full');
    config.compact = parsed.compact === true;
    config.diagnostics = parsed.diagnostics === true;
    config.counters = normalizeCounters(
      parsed.counters,
      parsed.showCounters === false ? {} : DEFAULT_COUNTERS
    );
    config.theme = pick(THEMES, parsed.theme, 'dark');
    config.fontSize = pick(SIZES, parsed.fontSize, 'medium');
    config.safeArea = pick(SAFE_KEYS, parsed.safeArea, 'small');

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
      nameMode: params.get('nameMode') || (params.get('names') === '0' ? 'hidden' : 'full'),
      compact: params.get('compact') === '1',
      diagnostics: params.get('diag') === '1',
      counters: params.get('counters')
        ? params.get('counters').split(',').reduce(function (acc, key) { acc[key] = true; return acc; }, {})
        : DEFAULT_COUNTERS,
      theme: params.get('theme'),
      fontSize: params.get('size'),
      safeArea: params.get('safe'),

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
