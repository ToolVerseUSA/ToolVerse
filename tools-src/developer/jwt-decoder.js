/* JWT Decoder — browser-local decode only (no signature verification). No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('jw-input');
  if (!input) return;

  var headerEl = document.getElementById('jw-header');
  var payloadEl = document.getElementById('jw-payload');
  var status = document.getElementById('jw-status');
  var errorEl = document.getElementById('jw-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('jwt-decoder', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function decodeSegment(seg) {
    var b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var binary = atob(b64);
    var bytes = Uint8Array.from(binary, function (c) { return c.charCodeAt(0); });
    var json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  }

  function fmtTime(ts) {
    return new Date(ts * 1000).toLocaleString('en-US', { timeZoneName: 'short' }) + ' (' + new Date(ts * 1000).toISOString() + ')';
  }

  function run() {
    var token = input.value.trim();
    headerEl.textContent = '';
    payloadEl.textContent = '';
    status.textContent = 'Paste a token and press Decode.';
    if (!token) { hideError(); return; }
    var parts = token.split('.');
    if (parts.length !== 3) {
      showError('That does not look like a JWT — a signed JWT has exactly 3 segments separated by dots (found ' + parts.length + '). Encrypted JWEs (5 segments) cannot be decoded.');
      return;
    }
    try {
      var header = decodeSegment(parts[0]);
      var payload = decodeSegment(parts[1]);
      hideError();
      headerEl.textContent = JSON.stringify(header, null, 2);
      payloadEl.textContent = JSON.stringify(payload, null, 2);
      var notes = [];
      if (payload.exp) {
        var now = Math.floor(Date.now() / 1000);
        notes.push(payload.exp > now
          ? 'Expiry (exp): ' + fmtTime(payload.exp) + ' — still valid by the clock.'
          : 'Expiry (exp): ' + fmtTime(payload.exp) + ' — EXPIRED.');
      } else {
        notes.push('No exp claim — this token does not expire by its own claims.');
      }
      if (payload.iat) notes.push('Issued at (iat): ' + fmtTime(payload.iat) + '.');
      if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) notes.push('Not valid before (nbf): ' + fmtTime(payload.nbf) + ' — not yet active.');
      status.textContent = notes.join(' ');
      trackUse();
    } catch (e) {
      showError('Could not decode that token: ' + e.message);
    }
  }

  document.getElementById('jw-run').addEventListener('click', run);
  document.getElementById('jw-clear').addEventListener('click', function () {
    input.value = ''; run(); input.focus();
  });
  input.addEventListener('input', run);
})();
