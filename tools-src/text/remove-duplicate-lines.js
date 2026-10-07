/* Remove Duplicate Lines — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('rd-input');
  if (!input) return;

  var output = document.getElementById('rd-output');
  var stats = document.getElementById('rd-stats');
  var ci = document.getElementById('rd-ci');
  var errorEl = document.getElementById('rd-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('remove-duplicate-lines', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) {
      output.value = '';
      stats.textContent = 'Your cleaned text will appear here.';
      return;
    }
    var lines = text.split('\n');
    var seen = new Set();
    var kept = [];
    for (var i = 0; i < lines.length; i++) {
      var key = ci.checked ? lines[i].toLowerCase() : lines[i];
      if (!seen.has(key)) { seen.add(key); kept.push(lines[i]); }
    }
    output.value = kept.join('\n');
    var removed = lines.length - kept.length;
    stats.textContent = lines.length + ' lines in · ' + removed + ' duplicate' + (removed === 1 ? '' : 's') + ' removed · ' + kept.length + ' unique lines out.';
    if (kept.length > 0) trackUse();
  }

  document.getElementById('rd-run').addEventListener('click', process);
  document.getElementById('rd-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('rd-copy').addEventListener('click', function () {
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
  ci.addEventListener('change', process);
  process();
})();
