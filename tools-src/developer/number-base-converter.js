/* Number Base Converter — browser-local, BigInt precision. No data leaves the page. */
(function () {
  'use strict';
  var fields = {
    2: document.getElementById('nb-bin'),
    8: document.getElementById('nb-oct'),
    10: document.getElementById('nb-dec'),
    16: document.getElementById('nb-hex')
  };
  if (!fields[10]) return;

  var errorEl = document.getElementById('nb-error');
  var tracked = false;
  var BASES = [2, 8, 10, 16];
  var DIGITS = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^[0-9]+$/, 16: /^[0-9a-fA-F]+$/ };
  var NAMES = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('number-base-converter', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function parseInBase(str, base) {
    var digits = '0123456789abcdef';
    var result = 0n;
    var b = BigInt(base);
    for (var i = 0; i < str.length; i++) {
      result = result * b + BigInt(digits.indexOf(str[i].toLowerCase()));
    }
    return result;
  }

  function sync(sourceBase) {
    var raw = fields[sourceBase].value.trim();
    if (!raw) {
      BASES.forEach(function (b) { if (b !== sourceBase) fields[b].value = ''; });
      hideError();
      return;
    }
    var negative = false;
    var s = raw;
    if (s[0] === '-') { negative = true; s = s.slice(1); }
    if (!DIGITS[sourceBase].test(s)) {
      showError(NAMES[sourceBase] + ' value contains a character that is not a valid base-' + sourceBase + ' digit.');
      return;
    }
    hideError();
    var value = parseInBase(s, sourceBase);
    if (negative) value = -value;
    BASES.forEach(function (b) {
      if (b === sourceBase) return;
      fields[b].value = (value < 0n ? '-' : '') + (value < 0n ? -value : value).toString(b).toUpperCase();
    });
    trackUse();
  }

  BASES.forEach(function (b) {
    fields[b].addEventListener('input', function () { sync(b); });
  });
  document.getElementById('nb-clear').addEventListener('click', function () {
    BASES.forEach(function (b) { fields[b].value = ''; });
    hideError();
    fields[10].focus();
  });
})();
