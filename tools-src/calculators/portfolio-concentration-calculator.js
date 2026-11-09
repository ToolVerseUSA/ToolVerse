/* Portfolio Concentration Calculator. HHI is the sum of squared weights in percent. */
(function () {
  'use strict';
  var form = document.getElementById('portfolio-concentration-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('portfolio-concentration-calculator-error');
  var ledeEl = document.getElementById('portfolio-concentration-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('portfolio-concentration-calculator', 'calculators', 'tool_use');
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

  var totalEl = document.getElementById('portfolio-concentration-calculator-total');
  var largestEl = document.getElementById('portfolio-concentration-calculator-largest');
  var largestShareEl = document.getElementById('portfolio-concentration-calculator-largestshare');
  var hhiEl = document.getElementById('portfolio-concentration-calculator-hhi');
  var readingEl = document.getElementById('portfolio-concentration-calculator-reading');
  var fall20El = document.getElementById('portfolio-concentration-calculator-fall20');
  var dollars20El = document.getElementById('portfolio-concentration-calculator-dollars20');
  var fall50El = document.getElementById('portfolio-concentration-calculator-fall50');
  var dollars50El = document.getElementById('portfolio-concentration-calculator-dollars50');
  var tableEl = document.getElementById('portfolio-concentration-calculator-table');

  function calculate() {
    hideError();
    var holdings = [];
    for (var n = 1; n <= 6; n++) {
      var nameEl = document.getElementById('portfolio-concentration-calculator-name' + n);
      var valueEl = document.getElementById('portfolio-concentration-calculator-value' + n);
      var v = valueEl.value === '' ? 0 : parseFloat(valueEl.value);
      if (isNaN(v) || v < 0) {
        showError('Enter a valid value for holding ' + n + ' (0 or more).');
        return;
      }
      if (v > 0) {
        var name = nameEl.value.trim();
        holdings.push({ name: name === '' ? 'Holding ' + n : name, value: v });
      }
    }
    if (holdings.length < 2) {
      showError('Enter at least 2 holdings with values above zero.');
      return;
    }
    var total = 0;
    for (var i = 0; i < holdings.length; i++) { total += holdings[i].value; }
    var hhi = 0;
    var largest = holdings[0];
    var rows = '';
    for (var j = 0; j < holdings.length; j++) {
      var w = holdings[j].value / total * 100;
      holdings[j].weight = w;
      hhi += w * w;
      if (holdings[j].value > largest.value) { largest = holdings[j]; }
      rows += '<tr><td>' + holdings[j].name + '</td><td>' + fmtMoney(holdings[j].value) +
        '</td><td>' + w.toFixed(1) + '%</td></tr>';
    }
    tableEl.innerHTML = rows;
    var reading = hhi < 1500 ? 'Diversified' : (hhi <= 2500 ? 'Moderate concentration' : 'Concentrated');
    totalEl.textContent = fmtMoney(total);
    largestEl.textContent = largest.name + ' (' + fmtMoney(largest.value) + ')';
    largestShareEl.textContent = largest.weight.toFixed(1) + '% of the portfolio';
    hhiEl.textContent = Math.round(hhi).toLocaleString('en-US');
    readingEl.textContent = reading + ' (under 1,500 diversified, 1,500 to 2,500 moderate, over 2,500 concentrated)';
    fall20El.textContent = (largest.weight * 0.2).toFixed(1) + '% of the portfolio';
    dollars20El.textContent = fmtMoney(largest.value * 0.2);
    fall50El.textContent = (largest.weight * 0.5).toFixed(1) + '% of the portfolio';
    dollars50El.textContent = fmtMoney(largest.value * 0.5);
    ledeEl.textContent = 'Your largest holding, ' + largest.name + ', is ' + largest.weight.toFixed(1) +
      '% of the portfolio. HHI ' + Math.round(hhi).toLocaleString('en-US') + ' reads as ' + reading.toLowerCase() + '.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
