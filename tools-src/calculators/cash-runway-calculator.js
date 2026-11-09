/* Cash Runway Calculator. Net burn equals costs minus revenue; runway ends at the reserve. */
(function () {
  'use strict';
  var form = document.getElementById('cash-runway-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('cash-runway-calculator-error');
  var ledeEl = document.getElementById('cash-runway-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('cash-runway-calculator', 'calculators', 'tool_use');
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

  var cashEl = document.getElementById('cash-runway-calculator-cash');
  var burnEl = document.getElementById('cash-runway-calculator-burn');
  var revenueEl = document.getElementById('cash-runway-calculator-revenue');
  var reserveEl = document.getElementById('cash-runway-calculator-reserve');
  var netBurnEl = document.getElementById('cash-runway-calculator-netburn');
  var monthsEl = document.getElementById('cash-runway-calculator-months');
  var endDateEl = document.getElementById('cash-runway-calculator-enddate');
  var after12El = document.getElementById('cash-runway-calculator-after12');
  var tableEl = document.getElementById('cash-runway-calculator-table');

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function calculate() {
    hideError();
    var cash = parseFloat(cashEl.value);
    var burn = parseFloat(burnEl.value);
    var revenue = revenueEl.value === '' ? 0 : parseFloat(revenueEl.value);
    var reserve = reserveEl.value === '' ? 0 : parseFloat(reserveEl.value);
    if (isNaN(cash) || cash < 0) {
      showError('Enter a valid cash on hand amount (0 or more).');
      return;
    }
    if (isNaN(burn) || burn < 0) {
      showError('Enter a valid monthly burn (0 or more).');
      return;
    }
    if (isNaN(revenue) || revenue < 0) {
      showError('Enter a valid monthly revenue (0 or more).');
      return;
    }
    if (isNaN(reserve) || reserve < 0) {
      showError('Enter a valid reserve (0 or more).');
      return;
    }
    if (reserve > cash) {
      showError('The reserve cannot be larger than the cash on hand.');
      return;
    }
    var netBurn = burn - revenue;
    netBurnEl.textContent = fmtMoney(netBurn) + ' per month';
    var balance = cash;
    var rows = '';
    var showMonths = 24;
    for (var m = 1; m <= showMonths; m++) {
      balance -= netBurn;
      rows += '<tr><td>Month ' + m + '</td><td>' + fmtMoney(burn) + '</td><td>' +
        fmtMoney(revenue) + '</td><td>' + fmtMoney(balance) + '</td></tr>';
      if (balance <= reserve) { break; }
    }
    tableEl.innerHTML = rows;
    var after12 = cash - netBurn * 12;
    if (netBurn > 0 && after12 < reserve) { after12 = reserve; }
    after12El.textContent = fmtMoney(after12);
    if (netBurn <= 0) {
      monthsEl.textContent = 'Indefinite at current rates';
      endDateEl.textContent = 'No end date, revenue covers costs';
      ledeEl.textContent = 'Your revenue covers your monthly costs, so your cash is not shrinking. The runway is indefinite at current rates.';
    } else {
      var months = (cash - reserve) / netBurn;
      var wholeMonths = Math.floor(months);
      var end = new Date();
      end.setMonth(end.getMonth() + wholeMonths);
      monthsEl.textContent = months.toFixed(1) + ' months';
      endDateEl.textContent = fmtDate(end) + ' (about ' + wholeMonths + ' full months from today)';
      ledeEl.textContent = 'At a net burn of ' + fmtMoney(netBurn) + ' per month, your cash lasts about ' +
        months.toFixed(1) + ' months before it reaches your ' + fmtMoney(reserve) + ' reserve.';
    }
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
