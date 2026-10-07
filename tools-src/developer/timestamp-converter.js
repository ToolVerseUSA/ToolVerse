/* Timestamp Converter — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('ts-input');
  if (!input) return;

  var nowEl = document.getElementById('ts-now');
  var unitEl = document.getElementById('ts-unit');
  var localEl = document.getElementById('ts-local');
  var utcEl = document.getElementById('ts-utc');
  var relEl = document.getElementById('ts-rel');
  var dateEl = document.getElementById('ts-date');
  var secEl = document.getElementById('ts-sec');
  var msEl = document.getElementById('ts-ms');
  var errorEl = document.getElementById('ts-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('timestamp-converter', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function tick() {
    var now = new Date();
    nowEl.textContent = 'Current timestamp: ' + Math.floor(now.getTime() / 1000) + ' s · ' + now.getTime() + ' ms — ' + now.toLocaleString('en-US');
  }
  setInterval(tick, 1000);
  tick();

  function relative(date) {
    var diffMs = date.getTime() - Date.now();
    var abs = Math.abs(diffMs);
    var units = [['year', 31557600000], ['month', 2629800000], ['week', 604800000], ['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000]];
    for (var i = 0; i < units.length; i++) {
      var n = Math.floor(abs / units[i][1]);
      if (n >= 1) return (diffMs < 0 ? n + ' ' + units[i][0] + (n === 1 ? '' : 's') + ' ago' : 'in ' + n + ' ' + units[i][0] + (n === 1 ? '' : 's'));
    }
    return 'just now';
  }

  function convert() {
    var raw = input.value.trim();
    if (!raw) {
      unitEl.textContent = '—'; localEl.textContent = '—'; utcEl.textContent = '—'; relEl.textContent = '—';
      hideError();
      return;
    }
    if (!/^-?\d+$/.test(raw)) { showError('Enter digits only — a whole-number timestamp.'); return; }
    var value = BigInt(raw);
    var isMs = raw.replace('-', '').length >= 12;
    var ms = isMs ? Number(value) : Number(value) * 1000;
    var date = new Date(ms);
    if (isNaN(date.getTime())) { showError('That timestamp is outside the range a browser date can represent.'); return; }
    hideError();
    unitEl.textContent = isMs ? 'milliseconds' : 'seconds';
    localEl.textContent = date.toLocaleString('en-US', { timeZoneName: 'short' });
    utcEl.textContent = date.toUTCString();
    relEl.textContent = relative(date);
    trackUse();
  }

  function dateToTs() {
    if (!dateEl.value) { secEl.textContent = '—'; msEl.textContent = '—'; return; }
    var d = new Date(dateEl.value);
    if (isNaN(d.getTime())) { secEl.textContent = '—'; msEl.textContent = '—'; return; }
    secEl.textContent = String(Math.floor(d.getTime() / 1000));
    msEl.textContent = String(d.getTime());
    trackUse();
  }

  document.getElementById('ts-clear').addEventListener('click', function () {
    input.value = ''; convert(); input.focus();
  });
  input.addEventListener('input', convert);
  dateEl.addEventListener('input', dateToTs);
  convert();
})();
