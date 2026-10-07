/* Add Line Numbers — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('aln-input');
  if (!input) return;

  var output = document.getElementById('aln-output');
  var startEl = document.getElementById('aln-start');
  var sep = document.getElementById('aln-sep');
  var pad = document.getElementById('aln-pad');
  var errorEl = document.getElementById('aln-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('add-line-numbers', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) { output.value = ''; return; }
    var start = parseInt(startEl.value, 10);
    if (isNaN(start)) start = 1;
    var lines = text.split('\n');
    var width = String(start + lines.length - 1).length;
    output.value = lines.map(function (line, i) {
      var n = String(start + i);
      if (pad.checked) n = n.padStart(width, ' ');
      return n + sep.value + line;
    }).join('\n');
    trackUse();
  }

  document.getElementById('aln-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('aln-copy').addEventListener('click', function () {
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
  startEl.addEventListener('input', process);
  sep.addEventListener('change', process);
  pad.addEventListener('change', process);
  process();
})();
