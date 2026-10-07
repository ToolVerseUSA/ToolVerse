/* Random Picker — cryptographic Fisher–Yates shuffle. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('rp-input');
  if (!input) return;

  var countEl = document.getElementById('rp-count');
  var removeEl = document.getElementById('rp-remove');
  var stats = document.getElementById('rp-stats');
  var outEl = document.getElementById('rp-output');
  var errorEl = document.getElementById('rp-error');
  var tracked = false;
  var pool = null; // working pool when remove-after-pick is on
  var winners = [];

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-picker', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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
  function entries() {
    return input.value.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l !== ''; });
  }
  function render() {
    if (!winners.length) {
      outEl.innerHTML = '';
      return;
    }
    outEl.innerHTML = winners.map(function (w, i) {
      return '<p class="result-lede">Pick ' + (i + 1) + ': <strong>' + esc(w) + '</strong></p>';
    }).join('');
  }
  function resetPool() { pool = null; winners = []; render(); }

  function pick() {
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Pick at least 1 winner.'); return; }
    var source;
    if (removeEl.checked) {
      if (pool === null) pool = entries();
      source = pool;
      if (!source.length) { showError('The pool is empty — every entry has been picked. Clear and start again for a fresh pool.'); return; }
      if (count > source.length) { showError('Only ' + source.length + ' entries remain in the pool — pick fewer or reset.'); return; }
      var idx = shuffle(source.map(function (_, i) { return i; }));
      var drawnIdx = idx.slice(0, count);
      var drawn = drawnIdx.map(function (i) { return source[i]; });
      var drawnIdxSet = new Set(drawnIdx);
      pool = source.filter(function (_, i) { return !drawnIdxSet.has(i); });
      winners = winners.concat(drawn);
      stats.textContent = drawn.length + ' picked · ' + pool.length + ' entries remain in the pool.';
    } else {
      source = entries();
      if (!source.length) { showError('Add at least one entry first.'); return; }
      if (count > source.length) { showError('You asked for ' + count + ' picks from only ' + source.length + ' entries — lower the pick count.'); return; }
      winners = shuffle(source.slice()).slice(0, count);
      stats.textContent = winners.length + ' picked from ' + source.length + ' entries.';
    }
    hideError();
    render();
    trackUse();
  }

  document.getElementById('rp-pick').addEventListener('click', pick);
  document.getElementById('rp-clear').addEventListener('click', function () {
    input.value = '';
    resetPool();
    stats.textContent = 'Add entries and press Pick.';
    hideError();
    input.focus();
  });
  document.getElementById('rp-copy').addEventListener('click', function () {
    if (!winners.length) { showError('Pick some winners first.'); return; }
    hideError();
    var text = winners.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      showError('Copy is not available in this browser.');
    }
  });
  input.addEventListener('input', resetPool);
  removeEl.addEventListener('change', resetPool);
})();
