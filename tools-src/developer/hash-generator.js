/* Hash Generator — browser-local via Web Crypto (crypto.subtle). No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('hg-input');
  if (!input) return;

  var els = {
    'SHA-1': document.getElementById('hg-sha1'),
    'SHA-256': document.getElementById('hg-sha256'),
    'SHA-384': document.getElementById('hg-sha384'),
    'SHA-512': document.getElementById('hg-sha512')
  };
  var errorEl = document.getElementById('hg-error');
  var tracked = false;
  var runId = 0;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('hash-generator', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function toHex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function update() {
    var id = ++runId;
    var text = input.value;
    if (!text) {
      Object.keys(els).forEach(function (k) { els[k].textContent = '—'; });
      hideError();
      return;
    }
    if (!(window.crypto && crypto.subtle)) {
      showError('Web Crypto is not available in this browser/context (a secure context, HTTPS or localhost, is required).');
      return;
    }
    hideError();
    var data = new TextEncoder().encode(text);
    Object.keys(els).forEach(function (algo) {
      crypto.subtle.digest(algo, data).then(function (buf) {
        if (id === runId) els[algo].textContent = toHex(buf);
      }).catch(function () {
        if (id === runId) els[algo].textContent = 'error';
      });
    });
    trackUse();
  }

  var timer = null;
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(update, 200); });
  update();
})();
