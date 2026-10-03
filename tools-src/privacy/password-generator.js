/* Password Generator — crypto.getRandomValues, browser-local. Nothing stored. */
(function () {
  'use strict';
  var lenEl = document.getElementById('pg-length');
  if (!lenEl) return;

  var tracked = false;
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('password-generator', 'privacy', 'tool_use');
    }
  }
  function showError(msg) {
    var e = document.getElementById('pg-error');
    e.textContent = msg; e.hidden = false;
  }
  function hideError() {
    var e = document.getElementById('pg-error');
    e.hidden = true; e.textContent = '';
  }

  var SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
  };

  lenEl.addEventListener('input', function () {
    document.getElementById('pg-len-label').textContent = lenEl.value;
  });

  function secureIndex(max) {
    var arr = new Uint32Array(1);
    var limit = Math.floor(4294967296 / max) * max;
    var x;
    do {
      window.crypto.getRandomValues(arr);
      x = arr[0];
    } while (x >= limit);
    return x % max;
  }

  document.getElementById('pg-generate').addEventListener('click', function () {
    hideError();
    var pool = '';
    ['upper', 'lower', 'digits', 'symbols'].forEach(function (k) {
      if (document.getElementById('pg-' + k).checked) pool += SETS[k];
    });
    if (!pool) { showError('Select at least one character type.'); return; }
    var len = parseInt(lenEl.value, 10) || 16;
    var out = '';
    for (var i = 0; i < len; i++) out += pool[secureIndex(pool.length)];
    document.getElementById('pg-output').textContent = out;
    var entropy = Math.round(len * Math.log2(pool.length));
    document.getElementById('pg-entropy').textContent = 'Entropy: ~' + entropy + ' bits';
    var label = entropy < 60 ? 'Weak' : entropy < 90 ? 'Good' : 'Strong';
    document.getElementById('pg-strength').textContent = 'Strength: ' + label;
    trackUse();
  });

  document.getElementById('pg-copy').addEventListener('click', function () {
    var t = document.getElementById('pg-output').textContent;
    if (!t || t === 'Press Generate') { showError('Generate a password first.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(hideError, function () { showError('Copy failed in this browser.'); });
    } else showError('Copy is not supported in this browser.');
  });
})();
