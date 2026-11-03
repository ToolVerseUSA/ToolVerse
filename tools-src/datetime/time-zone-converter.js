/* Time Zone Converter — pure JS via Intl.DateTimeFormat. No data leaves
   the page. Daylight saving is handled by the browser's IANA database. */
(function () {
  'use strict';
  var form = document.getElementById('tz-form');
  if (!form) return; // not on this page — safe global include

  var ZONES = [
    ['UTC', 'UTC — Coordinated Universal Time'],
    ['America/New_York', 'New York, USA (Eastern)'],
    ['America/Chicago', 'Chicago, USA (Central)'],
    ['America/Denver', 'Denver, USA (Mountain)'],
    ['America/Los_Angeles', 'Los Angeles, USA (Pacific)'],
    ['America/Toronto', 'Toronto, Canada'],
    ['America/Vancouver', 'Vancouver, Canada'],
    ['America/Mexico_City', 'Mexico City, Mexico'],
    ['America/Sao_Paulo', 'São Paulo, Brazil'],
    ['Europe/London', 'London, UK'],
    ['Europe/Paris', 'Paris, France'],
    ['Europe/Berlin', 'Berlin, Germany'],
    ['Europe/Madrid', 'Madrid, Spain'],
    ['Europe/Moscow', 'Moscow, Russia'],
    ['Africa/Cairo', 'Cairo, Egypt'],
    ['Africa/Lagos', 'Lagos, Nigeria'],
    ['Asia/Dubai', 'Dubai, UAE'],
    ['Asia/Karachi', 'Karachi, Pakistan'],
    ['Asia/Kolkata', 'Kolkata, India'],
    ['Asia/Dhaka', 'Dhaka, Bangladesh'],
    ['Asia/Bangkok', 'Bangkok, Thailand'],
    ['Asia/Singapore', 'Singapore'],
    ['Asia/Shanghai', 'Shanghai, China'],
    ['Asia/Hong_Kong', 'Hong Kong'],
    ['Asia/Tokyo', 'Tokyo, Japan'],
    ['Asia/Seoul', 'Seoul, South Korea'],
    ['Australia/Sydney', 'Sydney, Australia'],
    ['Australia/Melbourne', 'Melbourne, Australia'],
    ['Pacific/Auckland', 'Auckland, New Zealand']
  ];

  var dateEl = document.getElementById('tz-date');
  var timeEl = document.getElementById('tz-time');
  var fromEl = document.getElementById('tz-from');
  var toEl = document.getElementById('tz-to');
  var errorEl = document.getElementById('tz-error');
  var ledeEl = document.getElementById('tz-lede');
  var inputEchoEl = document.getElementById('tz-input-echo');
  var outputEl = document.getElementById('tz-output');
  var diffEl = document.getElementById('tz-diff');
  var utcEl = document.getElementById('tz-utc');
  var fromOffsetEl = document.getElementById('tz-from-offset');
  var toOffsetEl = document.getElementById('tz-to-offset');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('time-zone-converter', 'datetime', 'tool_use');
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function fillSelect(el, selected) {
    ZONES.forEach(function (z) {
      var opt = document.createElement('option');
      opt.value = z[0];
      opt.textContent = z[1];
      if (z[0] === selected) opt.selected = true;
      el.appendChild(opt);
    });
  }

  // Offset (ms) of a zone at a UTC instant: wall-clock reading minus UTC.
  function tzOffsetMs(utcMs, tz) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    var p = {};
    dtf.formatToParts(new Date(utcMs)).forEach(function (part) { p[part.type] = part.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return asUTC - utcMs;
  }

  // Wall-clock time in `tz` -> absolute UTC instant (two passes converge
  // except across a DST transition, where the result is the browser's best
  // interpretation — noted in the FAQ).
  function wallToUtcMs(y, mo, d, h, mi, tz) {
    var guess = Date.UTC(y, mo - 1, d, h, mi, 0);
    var off1 = tzOffsetMs(guess, tz);
    var utc = guess - off1;
    var off2 = tzOffsetMs(utc, tz);
    if (off2 !== off1) utc = guess - off2;
    return utc;
  }

  function fmtInZone(ms, tz) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date(ms));
  }

  function offsetLabel(ms, tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'shortOffset', hour: 'numeric'
    }).formatToParts(new Date(ms));
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'timeZoneName') return parts[i].value;
    }
    var off = tzOffsetMs(ms, tz) / 3600000;
    return 'GMT' + (off >= 0 ? '+' : '') + off;
  }

  function zoneShort(tz) {
    for (var i = 0; i < ZONES.length; i++) {
      if (ZONES[i][0] === tz) return ZONES[i][1].split(' (')[0].split(',')[0];
    }
    return tz;
  }

  function convert() {
    hideError();
    var dateVal = dateEl.value;
    var timeVal = timeEl.value;
    if (!dateVal || !timeVal) {
      showError('Pick both a date and a time to convert.');
      return;
    }
    var dp = dateVal.split('-');
    var tp = timeVal.split(':');
    var y = +dp[0], mo = +dp[1], d = +dp[2], h = +tp[0], mi = +tp[1];
    if (!y || !mo || !d || isNaN(h) || isNaN(mi)) {
      showError('Pick a valid date and time to convert.');
      return;
    }
    var from = fromEl.value;
    var to = toEl.value;
    var utcMs;
    try {
      utcMs = wallToUtcMs(y, mo, d, h, mi, from);
      var inputStr = fmtInZone(utcMs, from);
      var outputStr = fmtInZone(utcMs, to);
      var offFrom = tzOffsetMs(utcMs, from);
      var offTo = tzOffsetMs(utcMs, to);
      var diffHours = (offTo - offFrom) / 3600000;
      var diffText = diffHours === 0 ? 'Same time — no difference'
        : (diffHours > 0 ? '+' : '') + diffHours + ' hours';
      ledeEl.textContent = inputStr + ' (' + zoneShort(from) + ') = ' + outputStr + ' (' + zoneShort(to) + ')';
      inputEchoEl.textContent = inputStr + ' — ' + zoneShort(from);
      outputEl.textContent = outputStr + ' — ' + zoneShort(to);
      diffEl.textContent = diffText;
      utcEl.textContent = new Date(utcMs).toUTCString();
      fromOffsetEl.textContent = offsetLabel(utcMs, from);
      toOffsetEl.textContent = offsetLabel(utcMs, to);
      trackUse();
    } catch (e) {
      showError('That date or time zone could not be converted in this browser.');
    }
  }

  fillSelect(fromEl, 'UTC');
  fillSelect(toEl, 'America/New_York');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    convert();
  });
  [dateEl, timeEl, fromEl, toEl].forEach(function (el) {
    el.addEventListener('change', convert);
    el.addEventListener('input', convert);
  });
  document.getElementById('tz-swap').addEventListener('click', function () {
    var tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    convert();
  });

  convert();
})();
