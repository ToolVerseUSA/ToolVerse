/* Drawdown Recovery Calculator. Gain needed equals loss divided by (1 minus loss). */
(function () {
  'use strict';
  var form = document.getElementById('drawdown-recovery-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('drawdown-recovery-calculator-error');
  var ledeEl = document.getElementById('drawdown-recovery-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('drawdown-recovery-calculator', 'calculators', 'tool_use');
    }
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function fmtMoney(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  function fmtNum(value) {
    return value.toLocaleString('en-US');
  }
  function fmtPct(value) {
    return value.toFixed(1) + '%';
  }

  var lossEl = document.getElementById('drawdown-recovery-calculator-loss');
  var returnEl = document.getElementById('drawdown-recovery-calculator-return');
  var gainEl = document.getElementById('drawdown-recovery-calculator-gain');
  var afterEl = document.getElementById('drawdown-recovery-calculator-after');
  var dollarsEl = document.getElementById('drawdown-recovery-calculator-dollars');
  var yearsEl = document.getElementById('drawdown-recovery-calculator-years');

  function calculate() {
    hideError();
    var loss = parseFloat(lossEl.value);
    var ret = returnEl.value === '' ? 7 : parseFloat(returnEl.value);
    if (isNaN(loss) || loss <= 0 || loss >= 100) {
      showError('Enter a portfolio loss between 0% and 100% (not including 0 or 100).');
      return;
    }
    if (isNaN(ret) || ret < 0 || ret > 50) {
      showError('Enter a recovery return between 0% and 50%.');
      return;
    }
    var lossFrac = loss / 100;
    var gainFrac = lossFrac / (1 - lossFrac);
    var gainPct = gainFrac * 100;
    var after = 10000 * (1 - lossFrac);
    var dollars = 10000 - after;
    gainEl.textContent = fmtPct(gainPct);
    afterEl.textContent = fmtMoney(after);
    dollarsEl.textContent = fmtMoney(dollars);
    if (ret === 0) {
      yearsEl.textContent = 'No recovery at a 0% return';
      ledeEl.textContent = 'A ' + fmtPct(loss) + ' loss needs a ' + fmtPct(gainPct) +
        ' gain to recover. On $10,000 that means growing ' + fmtMoney(after) + ' back to $10,000.';
    } else {
      var years = Math.log(1 + gainFrac) / Math.log(1 + ret / 100);
      yearsEl.textContent = years.toFixed(1) + ' years (at a steady ' + ret + '% a year)';
      ledeEl.textContent = 'A ' + fmtPct(loss) + ' loss needs a ' + fmtPct(gainPct) +
        ' gain to recover, about ' + years.toFixed(1) + ' years at a steady ' + ret + '% return a year.';
    }
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
