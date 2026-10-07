/* Lottery Number Generator — crypto RNG quick picks. Presets verified against current official rules (Oct 2026):
   Powerball 5/69 + 1/26; Mega Millions 5/70 + Mega Ball 1/24 (April 2025 rules). No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('ln-output');
  if (!output) return;

  var gameEl = document.getElementById('ln-game');
  var customEl = document.getElementById('ln-custom');
  var picksEl = document.getElementById('ln-picks');
  var poolEl = document.getElementById('ln-pool');
  var bonusPoolEl = document.getElementById('ln-bonus-pool');
  var linesEl = document.getElementById('ln-lines');
  var errorEl = document.getElementById('ln-error');
  var tracked = false;

  var PRESETS = {
    powerball: { picks: 5, pool: 69, bonusPool: 26, bonusName: 'Powerball' },
    mega: { picks: 5, pool: 70, bonusPool: 24, bonusName: 'Mega Ball' }
  };

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('lottery-number-generator', 'generators', 'tool_use');
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
  function sampleUnique(pool, n) {
    var a = [];
    for (var i = 1; i <= pool; i++) a.push(i);
    for (var i = a.length - 1; i > 0; i--) {
      var j = randBelow(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n).sort(function (x, y) { return x - y; });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function syncCustom() {
    customEl.style.display = gameEl.value === 'custom' ? '' : 'none';
  }

  var lastLines = [];
  function generate() {
    var cfg;
    if (gameEl.value === 'custom') {
      cfg = {
        picks: parseInt(picksEl.value, 10),
        pool: parseInt(poolEl.value, 10),
        bonusPool: parseInt(bonusPoolEl.value, 10) || 0,
        bonusName: 'Bonus'
      };
      if (isNaN(cfg.picks) || isNaN(cfg.pool) || cfg.picks < 1 || cfg.pool < cfg.picks) {
        showError('Custom game: the pool must be at least as large as the pick count.');
        return;
      }
    } else {
      cfg = PRESETS[gameEl.value];
    }
    var lines = parseInt(linesEl.value, 10);
    if (isNaN(lines) || lines < 1) { showError('Generate at least 1 line.'); return; }
    if (lines > 10) { lines = 10; linesEl.value = '10'; }
    hideError();
    lastLines = [];
    var html = '';
    for (var i = 0; i < lines; i++) {
      var mains = sampleUnique(cfg.pool, cfg.picks);
      var bonus = cfg.bonusPool > 0 ? randBelow(cfg.bonusPool) + 1 : null;
      var text = mains.join(' · ') + (bonus !== null ? '  +  ' + cfg.bonusName + ' ' + bonus : '');
      lastLines.push(text);
      html += '<p class="result-lede">Line ' + (i + 1) + ': <strong>' + esc(text) + '</strong></p>';
    }
    output.innerHTML = html;
    trackUse();
  }

  document.getElementById('ln-gen').addEventListener('click', generate);
  document.getElementById('ln-copy').addEventListener('click', function () {
    if (!lastLines.length) { showError('Generate some lines first.'); return; }
    hideError();
    var text = lastLines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      showError('Copy is not available in this browser.');
    }
  });
  gameEl.addEventListener('change', syncCustom);
  syncCustom();
})();
