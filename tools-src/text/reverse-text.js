/* Reverse Text — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('rt-input');
  if (!input) return;

  var output = document.getElementById('rt-output');
  var mode = document.getElementById('rt-mode');
  var errorEl = document.getElementById('rt-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('reverse-text', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) { output.value = ''; return; }
    var result;
    if (mode.value === 'chars') {
      result = Array.from(text).reverse().join('');
    } else if (mode.value === 'words') {
      result = text.split('\n').map(function (line) {
        var words = line.split(/\s+/).filter(function (w) { return w !== ''; });
        return words.reverse().join(' ');
      }).join('\n');
    } else {
      result = text.split('\n').reverse().join('\n');
    }
    output.value = result;
    trackUse();
  }

  document.getElementById('rt-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('rt-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — add some text first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
    trackUse();
  });
  input.addEventListener('input', process);
  mode.addEventListener('change', process);
  process();
})();
