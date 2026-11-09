/* Compound Interest Calculator. Monthly compounding, same method as the high-yield savings calculator. */
(function () {
  'use strict';
  var form = document.getElementById('compound-interest-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('compound-interest-calculator-error');
  var ledeEl = document.getElementById('compound-interest-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('compound-interest-calculator', 'calculators', 'tool_use');
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

  var startingEl = document.getElementById('compound-interest-calculator-starting');
  var monthlyEl = document.getElementById('compound-interest-calculator-monthly');
  var rateEl = document.getElementById('compound-interest-calculator-rate');
  var yearsEl = document.getElementById('compound-interest-calculator-years');
  var finalEl = document.getElementById('compound-interest-calculator-final');
  var contributedEl = document.getElementById('compound-interest-calculator-contributed');
  var interestEl = document.getElementById('compound-interest-calculator-interest');
  var rateUsedEl = document.getElementById('compound-interest-calculator-rate-used');
  var tableEl = document.getElementById('compound-interest-calculator-table');

  function calculate() {
    hideError();
    var starting = parseFloat(startingEl.value);
    var monthly = parseFloat(monthlyEl.value);
    var rate = parseFloat(rateEl.value);
    var years = parseInt(yearsEl.value, 10);
    if (isNaN(starting) || starting < 0) {
      showError('Enter a valid starting amount (0 or more).');
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      showError('Enter a valid monthly contribution (0 or more).');
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 25) {
      showError('Enter a valid annual interest rate between 0% and 25%.');
      return;
    }
    if (isNaN(years) || years < 1 || years > 50) {
      showError('Enter a whole number of years between 1 and 50.');
      return;
    }
    var monthlyRate = rate / 100 / 12;
    var balance = starting;
    var totalContributed = starting + monthly * 12 * years;
    var rows = '';
    for (var y = 1; y <= years; y++) {
      var yearStart = balance;
      var yearDeposits = 0;
      for (var m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthly;
        yearDeposits += monthly;
      }
      var yearInterest = balance - yearStart - yearDeposits;
      rows += '<tr><td>' + y + '</td><td>' + fmtMoney(yearDeposits) + '</td><td>' +
        fmtMoney(yearInterest) + '</td><td>' + fmtMoney(balance) + '</td></tr>';
    }
    var totalInterest = balance - totalContributed;
    ledeEl.textContent = 'After ' + years + (years === 1 ? ' year' : ' years') +
      ' at ' + rate + '%, your balance would be ' + fmtMoney(balance) + '.';
    finalEl.textContent = fmtMoney(balance);
    contributedEl.textContent = fmtMoney(totalContributed);
    interestEl.textContent = fmtMoney(totalInterest);
    rateUsedEl.textContent = rate + '% (entered by you)';
    tableEl.innerHTML = rows;
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
