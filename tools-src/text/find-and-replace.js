/* Find and Replace — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var textEl = document.getElementById('fr-text');
  if (!textEl) return;

  var findEl = document.getElementById('fr-find');
  var replaceEl = document.getElementById('fr-replace');
  var cs = document.getElementById('fr-cs');
  var whole = document.getElementById('fr-word');
  var output = document.getElementById('fr-output');
  var countEl = document.getElementById('fr-count');
  var errorEl = document.getElementById('fr-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('find-and-replace', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function makeRegex() {
    var find = findEl.value;
    if (!find) return null;
    var pattern = escRe(find);
    if (whole.checked) pattern = '\\b(?:' + pattern + ')\\b';
    return new RegExp(pattern, cs.checked ? 'g' : 'gi');
  }

  function updateCount() {
    var re = makeRegex();
    if (!re || !textEl.value) { countEl.textContent = '0 matches'; return; }
    var m = textEl.value.match(re);
    var n = m ? m.length : 0;
    countEl.textContent = n + ' match' + (n === 1 ? '' : 'es');
  }

  function run() {
    var re = makeRegex();
    if (!re) { showError('Type something in the Find box first.'); return; }
    hideError();
    var replacement = replaceEl.value;
    var count = 0;
    output.value = textEl.value.replace(re, function () { count++; return replacement; });
    countEl.textContent = count + ' replacement' + (count === 1 ? '' : 's') + ' made';
    if (count > 0) trackUse();
  }

  document.getElementById('fr-run').addEventListener('click', run);
  document.getElementById('fr-clear').addEventListener('click', function () {
    findEl.value = ''; replaceEl.value = ''; textEl.value = ''; output.value = '';
    hideError(); updateCount(); findEl.focus();
  });
  document.getElementById('fr-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — run a replacement first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  [findEl, replaceEl, textEl].forEach(function (el) { el.addEventListener('input', updateCount); });
  [cs, whole].forEach(function (el) { el.addEventListener('change', updateCount); });
  updateCount();
})();
