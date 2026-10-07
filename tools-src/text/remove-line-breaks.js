/* Remove Line Breaks — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('rlb-input');
  if (!input) return;

  var output = document.getElementById('rlb-output');
  var stats = document.getElementById('rlb-stats');
  var mode = document.getElementById('rlb-mode');
  var errorEl = document.getElementById('rlb-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('remove-line-breaks', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) {
      output.value = '';
      stats.textContent = 'Your text without line breaks will appear here.';
      return;
    }
    var breaks = (text.match(/\n/g) || []).length;
    var result;
    if (mode.value === 'space') {
      result = text.replace(/\s*\n\s*/g, ' ');
    } else if (mode.value === 'remove') {
      result = text.replace(/\n/g, '');
    } else {
      result = text.split(/\n\s*\n/).map(function (block) {
        return block.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l !== ''; }).join(' ');
      }).filter(function (b) { return b !== ''; }).join('\n\n');
    }
    output.value = result;
    var remaining = (result.match(/\n/g) || []).length;
    stats.textContent = (breaks - remaining) + ' line breaks removed.';
    trackUse();
  }

  document.getElementById('rlb-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('rlb-copy').addEventListener('click', function () {
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
