/* Random String Generator — cryptographically secure selection from the chosen charset. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('rs-output');
  if (!output) return;

  var lengthEl = document.getElementById('rs-length');
  var countEl = document.getElementById('rs-count');
  var sets = {
    lower: document.getElementById('rs-lower'),
    upper: document.getElementById('rs-upper'),
    digits: document.getElementById('rs-digits'),
    symbols: document.getElementById('rs-symbols')
  };
  var noambigEl = document.getElementById('rs-noambig');
  var errorEl = document.getElementById('rs-error');
  var tracked = false;

  var CHARSETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}<>?'
  };
  var AMBIG = /[0O1lI|`'"\\]/g;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-string-generator', 'generators', 'tool_use');
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

  function charset() {
    var pool = '';
    Object.keys(CHARSETS).forEach(function (k) { if (sets[k].checked) pool += CHARSETS[k]; });
    if (noambigEl.checked) pool = pool.replace(AMBIG, '');
    return pool;
  }

  function generate() {
    var length = parseInt(lengthEl.value, 10);
    var count = parseInt(countEl.value, 10);
    if (isNaN(length) || length < 1) { showError('Length must be at least 1.'); return; }
    if (length > 128) { length = 128; lengthEl.value = '128'; }
    if (isNaN(count) || count < 1) { showError('Generate at least 1 string.'); return; }
    if (count > 50) { count = 50; countEl.value = '50'; }
    var pool = charset();
    if (!pool) { showError('Select at least one character set.'); return; }
    hideError();
    var out = [];
    for (var i = 0; i < count; i++) {
      var s = '';
      for (var j = 0; j < length; j++) s += pool[randBelow(pool.length)];
      out.push(s);
    }
    output.value = out.join('\n');
    trackUse();
  }

  document.getElementById('rs-gen').addEventListener('click', generate);
  document.getElementById('rs-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some strings first.'); return; }
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
