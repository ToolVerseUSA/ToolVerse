/* Remove Extra Spaces — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('res-input');
  if (!input) return;

  var output = document.getElementById('res-output');
  var stats = document.getElementById('res-stats');
  var collapse = document.getElementById('res-collapse');
  var trim = document.getElementById('res-trim');
  var blank = document.getElementById('res-blank');
  var errorEl = document.getElementById('res-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('remove-extra-spaces', 'text', 'tool_use');
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
    var lines = text.split('\n').map(function (line) {
      var l = line;
      if (collapse.checked) l = l.replace(/[ \t]+/g, ' ');
      if (trim.checked) l = l.trim();
      return l;
    });
    if (blank.checked) lines = lines.filter(function (l) { return l !== ''; });
    var result = lines.join('\n');
    output.value = result;
    stats.textContent = (text.length - result.length) + ' extra characters removed (' + text.length + ' → ' + result.length + ' characters).';
    trackUse();
  }

  document.getElementById('res-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('res-copy').addEventListener('click', function () {
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
  collapse.addEventListener('change', process);
  trim.addEventListener('change', process);
  blank.addEventListener('change', process);
  process();
})();
