/* HTML Encoder & Decoder — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('he-input');
  if (!input) return;

  var output = document.getElementById('he-output');
  var mode = document.getElementById('he-mode');
  var errorEl = document.getElementById('he-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('html-encoder-decoder', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function encodeText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function decodeText(s) {
    var t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  function process() {
    var text = input.value;
    if (!text) { output.value = ''; return; }
    output.value = mode.value === 'encode' ? encodeText(text) : decodeText(text);
    trackUse();
  }

  document.getElementById('he-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('he-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — convert some text first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  input.addEventListener('input', process);
  mode.addEventListener('change', process);
  process();
})();
