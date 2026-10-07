/* Dice Roller — crypto RNG. No data leaves the page. */
(function () {
  'use strict';
  var diceEl = document.getElementById('dr-dice');
  if (!diceEl) return;

  var sidesEl = document.getElementById('dr-sides');
  var countEl = document.getElementById('dr-count');
  var totalEl = document.getElementById('dr-total');
  var historyEl = document.getElementById('dr-history');
  var errorEl = document.getElementById('dr-error');
  var tracked = false;
  var history = [];

  var PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('dice-roller', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function randBelow(n) {
    var limit = Math.floor(4294967296 / n) * n;
    var buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function dieHtml(value, sides) {
    if (sides === 6) {
      var pips = '';
      for (var i = 1; i <= 9; i++) pips += '<span class="pip' + (PIPS[value].indexOf(i) !== -1 ? ' on' : '') + '"></span>';
      return '<div class="die" role="img" aria-label="Die showing ' + value + '">' + pips + '</div>';
    }
    return '<div class="die die-num" role="img" aria-label="d' + sides + ' showing ' + value + '">' + value + '<small>d' + sides + '</small></div>';
  }

  function renderHistory() {
    if (!history.length) { historyEl.innerHTML = '<p class="result-lede">No rolls yet.</p>'; return; }
    historyEl.innerHTML = history.map(function (h) {
      return '<p class="result-lede">' + esc(h.label) + ': <strong>' + esc(h.values.join(', ')) + '</strong> = ' + h.total + '</p>';
    }).join('');
  }

  function roll() {
    var sides = parseInt(sidesEl.value, 10);
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Roll at least 1 die.'); return; }
    if (count > 10) { count = 10; countEl.value = '10'; }
    hideError();
    var values = [];
    for (var i = 0; i < count; i++) values.push(randBelow(sides) + 1);
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    diceEl.innerHTML = values.map(function (v) { return dieHtml(v, sides); }).join('');
    totalEl.textContent = count + ' × d' + sides + ' → ' + values.join(' + ') + ' = ' + total;
    history.unshift({ label: count + 'd' + sides, values: values, total: total });
    if (history.length > 20) history = history.slice(0, 20);
    renderHistory();
    trackUse();
  }

  document.getElementById('dr-roll').addEventListener('click', roll);
  document.getElementById('dr-clear-history').addEventListener('click', function () {
    history = [];
    renderHistory();
  });
})();
