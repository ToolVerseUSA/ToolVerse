/* Word Frequency Counter — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('wf-input');
  if (!input) return;

  var stats = document.getElementById('wf-stats');
  var tableWrap = document.getElementById('wf-table');
  var cs = document.getElementById('wf-cs');
  var numbers = document.getElementById('wf-numbers');
  var minLen = document.getElementById('wf-min');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('word-frequency-counter', 'text', 'tool_use');
    }
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function process() {
    var text = input.value;
    var source = cs.checked ? text : text.toLowerCase();
    var pattern = numbers.checked ? /[\p{L}\p{N}]+(?:'[\p{L}]+)?/gu : /[\p{L}]+(?:'[\p{L}]+)?/gu;
    var words = source.match(pattern) || [];
    var min = parseInt(minLen.value, 10) || 1;
    var counts = new Map();
    var total = 0;
    words.forEach(function (w) {
      if (w.length < min) return;
      total++;
      counts.set(w, (counts.get(w) || 0) + 1);
    });
    if (total === 0) {
      stats.textContent = 'Start typing to see your word frequencies.';
      tableWrap.innerHTML = '';
      return;
    }
    var rows = Array.from(counts.entries()).sort(function (a, b) {
      return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    });
    stats.textContent = total.toLocaleString('en-US') + ' words · ' + rows.length.toLocaleString('en-US') + ' unique. Showing the top ' + Math.min(100, rows.length) + '.';
    var max = rows[0][1];
    var html = '<table class="wf-table"><thead><tr><th scope="col">#</th><th scope="col">Word</th><th scope="col">Count</th><th scope="col">Share</th></tr></thead><tbody>';
    rows.slice(0, 100).forEach(function (row, i) {
      var pct = Math.round((row[1] / max) * 100);
      html += '<tr><td>' + (i + 1) + '</td><td>' + esc(row[0]) + '</td><td>' + row[1] + '</td><td><span class="wf-bar" style="width:' + pct + '%"></span></td></tr>';
    });
    html += '</tbody></table>';
    tableWrap.innerHTML = html;
    trackUse();
  }

  document.getElementById('wf-clear').addEventListener('click', function () {
    input.value = ''; process(); input.focus();
  });
  input.addEventListener('input', process);
  cs.addEventListener('change', process);
  numbers.addEventListener('change', process);
  minLen.addEventListener('change', process);
  process();
})();
