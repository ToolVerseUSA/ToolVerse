/* Sort Lines — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('sl-input');
  if (!input) return;

  var output = document.getElementById('sl-output');
  var stats = document.getElementById('sl-stats');
  var order = document.getElementById('sl-order');
  var blank = document.getElementById('sl-blank');
  var cs = document.getElementById('sl-cs');
  var errorEl = document.getElementById('sl-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('sort-lines', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) {
      output.value = '';
      stats.textContent = 'Your sorted text will appear here.';
      return;
    }
    var lines = text.split('\n');
    if (blank.checked) lines = lines.filter(function (l) { return l.trim() !== ''; });
    var opts = cs.checked ? { numeric: true } : { numeric: true, sensitivity: 'base' };
    lines.sort(function (a, b) { return a.localeCompare(b, 'en', opts); });
    if (order.value === 'desc') lines.reverse();
    output.value = lines.join('\n');
    stats.textContent = lines.length + ' lines sorted ' + (order.value === 'desc' ? 'Z → A.' : 'A → Z.');
    if (lines.length > 0) trackUse();
  }

  document.getElementById('sl-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('sl-copy').addEventListener('click', function () {
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
  order.addEventListener('change', process);
  blank.addEventListener('change', process);
  cs.addEventListener('change', process);
  process();
})();
