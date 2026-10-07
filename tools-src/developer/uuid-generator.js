/* UUID Generator — browser-local, crypto-random v4. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('uu-output');
  if (!output) return;

  var countEl = document.getElementById('uu-count');
  var upper = document.getElementById('uu-upper');
  var hyphens = document.getElementById('uu-hyphens');
  var errorEl = document.getElementById('uu-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('uuid-generator', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function uuidV4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function generate() {
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Enter a number of at least 1.'); return; }
    if (count > 50) { count = 50; countEl.value = '50'; }
    hideError();
    var list = [];
    for (var i = 0; i < count; i++) {
      var u = uuidV4();
      if (!hyphens.checked) u = u.replace(/-/g, '');
      if (upper.checked) u = u.toUpperCase();
      list.push(u);
    }
    output.value = list.join('\n');
    trackUse();
  }

  document.getElementById('uu-gen').addEventListener('click', generate);
  document.getElementById('uu-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some UUIDs first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  generate();
})();
