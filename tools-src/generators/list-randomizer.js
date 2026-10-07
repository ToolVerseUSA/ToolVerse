/* List Randomizer — cryptographic Fisher–Yates shuffle. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('lr-input');
  if (!input) return;

  var output = document.getElementById('lr-output');
  var stats = document.getElementById('lr-stats');
  var errorEl = document.getElementById('lr-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('list-randomizer', 'generators', 'tool_use');
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
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = randBelow(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function run() {
    var lines = input.value.split('\n').filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) {
      output.value = '';
      stats.textContent = 'Add at least 2 entries to shuffle.';
      if (input.value) showError('Add at least 2 entries to shuffle.');
      return;
    }
    hideError();
    var result = shuffle(lines.slice());
    output.value = result.join('\n');
    stats.textContent = result.length + ' entries shuffled.';
    trackUse();
  }

  document.getElementById('lr-shuffle').addEventListener('click', run);
  document.getElementById('lr-clear').addEventListener('click', function () {
    input.value = ''; output.value = ''; hideError();
    stats.textContent = 'Your shuffled list will appear here.';
    input.focus();
  });
  document.getElementById('lr-copy').addEventListener('click', function () {
    if (!output.value) { showError('Shuffle a list first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
})();
