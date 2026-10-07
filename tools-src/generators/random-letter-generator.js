/* Random Letter Generator — crypto RNG over the chosen alphabet. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('rl-output');
  if (!output) return;

  var modeEl = document.getElementById('rl-mode');
  var countEl = document.getElementById('rl-count');
  var nolookEl = document.getElementById('rl-nolook');
  var errorEl = document.getElementById('rl-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-letter-generator', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function randBelow(n) {
    var limit = Math.floor(4294967296 / n) * n;
    var buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }

  function alphabet() {
    var upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lower = upper.toLowerCase();
    var pool = modeEl.value === 'upper' ? upper : modeEl.value === 'lower' ? lower : upper + lower;
    if (nolookEl.checked) pool = pool.replace(/[OIl]/g, '');
    return pool;
  }

  function generate() {
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Generate at least 1 letter.'); return; }
    if (count > 100) { count = 100; countEl.value = '100'; }
    hideError();
    var pool = alphabet();
    var out = [];
    for (var i = 0; i < count; i++) out.push(pool[randBelow(pool.length)]);
    output.value = out.join(' ');
    trackUse();
  }

  document.getElementById('rl-gen').addEventListener('click', generate);
  document.getElementById('rl-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some letters first.'); return; }
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
