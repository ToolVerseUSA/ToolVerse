/* Regex Tester — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var patternEl = document.getElementById('rx-pattern');
  if (!patternEl) return;

  var textEl = document.getElementById('rx-text');
  var stats = document.getElementById('rx-stats');
  var list = document.getElementById('rx-list');
  var errorEl = document.getElementById('rx-error');
  var flagsEls = ['rx-i', 'rx-m', 'rx-s', 'rx-u'].map(function (id) { return document.getElementById(id); });
  var tracked = false;
  var MAX_MATCHES = 500;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('regex-tester', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function run() {
    var pattern = patternEl.value;
    var text = textEl.value;
    if (!pattern) {
      stats.textContent = 'Enter a pattern and test text to see matches.';
      list.innerHTML = '';
      hideError();
      return;
    }
    var flags = 'g';
    flagsEls.forEach(function (el) { if (el && el.checked) flags += el.id.replace('rx-', ''); });
    var re;
    try { re = new RegExp(pattern, flags); }
    catch (e) {
      stats.textContent = 'Enter a pattern and test text to see matches.';
      list.innerHTML = '';
      showError('Invalid regular expression: ' + e.message);
      return;
    }
    hideError();
    var matches = [];
    var m;
    var guard = 0;
    while ((m = re.exec(text)) !== null && guard < MAX_MATCHES + 1) {
      guard++;
      matches.push(m);
      if (m[0] === '') re.lastIndex++;
      if (re.lastIndex > text.length) break;
    }
    var capped = matches.length > MAX_MATCHES;
    if (capped) matches = matches.slice(0, MAX_MATCHES);
    if (matches.length === 0) {
      stats.textContent = 'No matches found.';
      list.innerHTML = '';
      return;
    }
    stats.textContent = matches.length + ' match' + (matches.length === 1 ? '' : 'es') + (capped ? ' (stopped at ' + MAX_MATCHES + ')' : '') + '.';
    var html = '<table class="wf-table"><thead><tr><th scope="col">#</th><th scope="col">Match</th><th scope="col">Index</th><th scope="col">Groups</th></tr></thead><tbody>';
    matches.forEach(function (mm, i) {
      var groups = mm.length > 1
        ? mm.slice(1).map(function (g, gi) { return ' $' + (gi + 1) + ': ' + esc(g === undefined ? '∅' : g); }).join(' ·')
        : '—';
      html += '<tr><td>' + (i + 1) + '</td><td>' + esc(mm[0]) + '</td><td>' + mm.index + '</td><td>' + groups + '</td></tr>';
    });
    html += '</tbody></table>';
    list.innerHTML = html;
    trackUse();
  }

  var timer = null;
  function auto() { clearTimeout(timer); timer = setTimeout(run, 250); }
  patternEl.addEventListener('input', auto);
  textEl.addEventListener('input', auto);
  flagsEls.forEach(function (el) { if (el) el.addEventListener('change', run); });
  run();
})();
