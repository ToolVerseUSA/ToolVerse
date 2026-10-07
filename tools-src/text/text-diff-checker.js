/* Text Diff Checker — browser-local line diff (LCS). No data leaves the page. */
(function () {
  'use strict';
  var aEl = document.getElementById('td-a');
  if (!aEl) return;

  var bEl = document.getElementById('td-b');
  var stats = document.getElementById('td-stats');
  var result = document.getElementById('td-result');
  var errorEl = document.getElementById('td-error');
  var tracked = false;
  var MAX_CELLS = 4000000; // ~2000 x 2000 lines

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('text-diff-checker', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function diffLines(a, b) {
    var n = a.length, m = b.length;
    var dp = [];
    var i, j;
    for (i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    var ops = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { ops.push({ t: 'same', text: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'del', text: a[i] }); i++; }
      else { ops.push({ t: 'add', text: b[j] }); j++; }
    }
    while (i < n) { ops.push({ t: 'del', text: a[i] }); i++; }
    while (j < m) { ops.push({ t: 'add', text: b[j] }); j++; }
    return ops;
  }

  function run() {
    var aText = aEl.value, bText = bEl.value;
    if (!aText && !bText) {
      stats.textContent = 'Add both texts and press Compare.';
      result.innerHTML = '';
      return;
    }
    var a = aText ? aText.split('\n') : [];
    var b = bText ? bText.split('\n') : [];
    if (a.length * b.length > MAX_CELLS) {
      showError('These texts are too large for an exact in-browser line diff (' + a.length + ' × ' + b.length + ' lines). Split them and compare in parts.');
      return;
    }
    hideError();
    var ops = diffLines(a, b);
    var added = 0, removed = 0, same = 0;
    var html = ops.map(function (op) {
      if (op.t === 'add') { added++; return '<div class="diff-line diff-add">+ ' + esc(op.text) + '</div>'; }
      if (op.t === 'del') { removed++; return '<div class="diff-line diff-del">&minus; ' + esc(op.text) + '</div>'; }
      same++;
      return '<div class="diff-line diff-same">&nbsp; ' + esc(op.text) + '</div>';
    }).join('');
    result.innerHTML = html;
    stats.textContent = added + ' lines added · ' + removed + ' lines removed · ' + same + ' lines unchanged.';
    trackUse();
  }

  var timer = null;
  function auto() { clearTimeout(timer); timer = setTimeout(run, 400); }
  document.getElementById('td-run').addEventListener('click', run);
  document.getElementById('td-clear').addEventListener('click', function () {
    aEl.value = ''; bEl.value = ''; hideError(); run(); aEl.focus();
  });
  aEl.addEventListener('input', auto);
  bEl.addEventListener('input', auto);
})();
