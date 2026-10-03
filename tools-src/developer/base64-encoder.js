/* Base64 Encoder/Decoder — UTF-8 aware, browser-local. */
(function () {
  'use strict';
  var input = document.getElementById('b64-input');
  if (!input) return;

  var output = document.getElementById('b64-output');
  var tracked = false;
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('base64-encoder', 'developer', 'tool_use');
    }
  }
  function showError(msg) {
    var e = document.getElementById('b64-error');
    e.textContent = msg; e.hidden = false;
  }
  function hideError() {
    var e = document.getElementById('b64-error');
    e.hidden = true; e.textContent = '';
  }
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s+/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  document.getElementById('b64-encode').addEventListener('click', function () {
    hideError();
    var t = input.value;
    if (!t) { showError('Type something to encode first.'); return; }
    try {
      output.textContent = utf8ToB64(t);
      trackUse();
    } catch (e) { showError('Encoding failed: ' + e.message); }
  });

  document.getElementById('b64-decode').addEventListener('click', function () {
    hideError();
    var t = input.value.trim();
    if (!t) { showError('Paste Base64 to decode first.'); return; }
    try {
      output.textContent = b64ToUtf8(t);
      trackUse();
    } catch (e) { showError('Invalid Base64: ' + e.message); }
  });

  document.getElementById('b64-clear').addEventListener('click', function () {
    input.value = '';
    output.textContent = '';
    hideError();
    input.focus();
  });

  document.getElementById('b64-copy').addEventListener('click', function () {
    var t = output.textContent;
    if (!t) { showError('Nothing to copy yet.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(hideError, function () { showError('Copy failed in this browser.'); });
    } else showError('Copy is not supported in this browser.');
  });
})();
