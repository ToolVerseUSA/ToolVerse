/* Team Generator — cryptographic Fisher–Yates shuffle + round-robin deal (sizes differ by ≤1). No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('tg-input');
  if (!input) return;

  var modeEl = document.getElementById('tg-mode');
  var valueEl = document.getElementById('tg-value');
  var stats = document.getElementById('tg-stats');
  var outEl = document.getElementById('tg-output');
  var errorEl = document.getElementById('tg-error');
  var tracked = false;
  var lastText = '';

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('team-generator', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function randBelow(n) {
    var limit = Math.floor(4294967296 / n) * n;
    var buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = randBelow(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function generate() {
    var names = input.value.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l !== ''; });
    if (names.length < 2) { showError('Add at least 2 names to make teams.'); return; }
    var value = parseInt(valueEl.value, 10);
    if (isNaN(value) || value < 1) { showError('Enter a valid number of teams or team size.'); return; }
    var teamCount;
    if (modeEl.value === 'teams') {
      teamCount = value;
      if (teamCount > names.length) { showError('You cannot have more teams (' + teamCount + ') than people (' + names.length + ').'); return; }
    } else {
      teamCount = Math.ceil(names.length / value);
    }
    hideError();
    var shuffled = shuffle(names.slice());
    var teams = [];
    for (var i = 0; i < teamCount; i++) teams.push([]);
    shuffled.forEach(function (name, idx) { teams[idx % teamCount].push(name); });
    outEl.innerHTML = teams.map(function (team, i) {
      return '<div class="result-grid-card" style="margin-bottom:12px"><h3>Team ' + (i + 1) + ' (' + team.length + ')</h3><p style="margin:0">' + team.map(esc).join('<br>') + '</p></div>';
    }).join('');
    lastText = teams.map(function (team, i) { return 'Team ' + (i + 1) + ':\n' + team.join('\n'); }).join('\n\n');
    var sizes = teams.map(function (t) { return t.length; });
    stats.textContent = names.length + ' people → ' + teamCount + ' teams (sizes ' + Math.min.apply(null, sizes) + '–' + Math.max.apply(null, sizes) + ').';
    trackUse();
  }

  document.getElementById('tg-gen').addEventListener('click', generate);
  document.getElementById('tg-clear').addEventListener('click', function () {
    input.value = ''; outEl.innerHTML = ''; lastText = '';
    stats.textContent = 'Add a roster and press Make teams.';
    hideError(); input.focus();
  });
  document.getElementById('tg-copy').addEventListener('click', function () {
    if (!lastText) { showError('Make some teams first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastText).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      showError('Copy is not available in this browser.');
    }
  });
})();
