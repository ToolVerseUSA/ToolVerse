/* Coin Flipper — crypto RNG. No data leaves the page. */
(function () {
  'use strict';
  var coin = document.getElementById('cf-coin');
  if (!coin) return;

  var modeEl = document.getElementById('cf-mode');
  var statusEl = document.getElementById('cf-status');
  var headsEl = document.getElementById('cf-heads');
  var tailsEl = document.getElementById('cf-tails');
  var totalEl = document.getElementById('cf-total');
  var streakEl = document.getElementById('cf-streak');
  var bestEl = document.getElementById('cf-best');
  var seriesEl = document.getElementById('cf-series');
  var flipBtn = document.getElementById('cf-flip');
  var tracked = false;

  var state;
  function reset() {
    state = { heads: 0, tails: 0, total: 0, streakSide: null, streak: 0, bestSide: null, best: 0, seriesDone: false };
    coin.textContent = '?';
    coin.classList.remove('tails');
    statusEl.textContent = 'Press Flip coin to begin.';
    render();
  }
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('coin-flipper', 'generators', 'tool_use');
    }
  }
  function randBit() {
    var buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % 2;
  }
  function render() {
    headsEl.textContent = String(state.heads);
    tailsEl.textContent = String(state.tails);
    totalEl.textContent = String(state.total);
    streakEl.textContent = state.streak ? state.streakSide + ' ×' + state.streak : '—';
    bestEl.textContent = state.best ? state.bestSide + ' ×' + state.best : '—';
    if (modeEl.value === 'single') {
      seriesEl.textContent = '—';
    } else {
      var need = Math.floor(parseInt(modeEl.value, 10) / 2) + 1;
      seriesEl.textContent = 'First to ' + need + ' (Heads ' + state.heads + ' – ' + state.tails + ' Tails)';
    }
  }
  function flip() {
    if (state.seriesDone) return;
    var heads = randBit() === 0;
    var side = heads ? 'Heads' : 'Tails';
    state.total++;
    if (heads) state.heads++; else state.tails++;
    if (state.streakSide === side) state.streak++;
    else { state.streakSide = side; state.streak = 1; }
    if (state.streak > state.best) { state.best = state.streak; state.bestSide = side; }
    coin.textContent = side;
    coin.classList.toggle('tails', !heads);
    coin.classList.remove('flip');
    void coin.offsetWidth; // restart animation
    coin.classList.add('flip');
    statusEl.textContent = side + '!';
    if (modeEl.value !== 'single') {
      var need = Math.floor(parseInt(modeEl.value, 10) / 2) + 1;
      if (state.heads >= need || state.tails >= need) {
        state.seriesDone = true;
        statusEl.textContent = side + ' wins the series ' + state.heads + '–' + state.tails + '! Press Reset to play again.';
      }
    }
    render();
    trackUse();
  }

  flipBtn.addEventListener('click', flip);
  document.getElementById('cf-reset').addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  reset();
})();
