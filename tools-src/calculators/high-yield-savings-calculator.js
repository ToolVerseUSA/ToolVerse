/* High-Yield Savings Calculator — monthly compounding, all in the browser.
   The APY is entered by the user; this tool never fetches or shows any
   bank's rate and never names or recommends a bank. */
(function () {
  'use strict';
  var form = document.getElementById('high-yield-savings-calculator-form');
  if (!form) return; // not on this page — safe global include

  var depositEl = document.getElementById('high-yield-savings-calculator-deposit');
  var monthlyEl = document.getElementById('high-yield-savings-calculator-monthly');
  var apyEl = document.getElementById('high-yield-savings-calculator-apy');
  var yearsEl = document.getElementById('high-yield-savings-calculator-years');
  var errorEl = document.getElementById('high-yield-savings-calculator-error');
  var ledeEl = document.getElementById('high-yield-savings-calculator-lede');
  var finalEl = document.getElementById('high-yield-savings-calculator-final');
  var contributedEl = document.getElementById('high-yield-savings-calculator-contributed');
  var interestEl = document.getElementById('high-yield-savings-calculator-interest');
  var apyUsedEl = document.getElementById('high-yield-savings-calculator-apy-used');
  var tableEl = document.getElementById('high-yield-savings-calculator-table');

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('high-yield-savings-calculator', 'calculators', 'tool_use');
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

  function calculate() {
    hideError();
    var deposit = parseFloat(depositEl.value);
    var monthly = parseFloat(monthlyEl.value);
    var apy = parseFloat(apyEl.value);
    var years = parseInt(yearsEl.value, 10);

    if (isNaN(deposit) || deposit < 0) {
      showError('Enter a valid initial deposit (0 or more).');
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      showError('Enter a valid monthly contribution (0 or more).');
      return;
    }
    if (isNaN(apy) || apy < 0 || apy > 25) {
      showError('Enter a valid APY between 0% and 25%.');
      return;
    }
    if (isNaN(years) || years < 1 || years > 50) {
      showError('Enter a whole number of years between 1 and 50.');
      return;
    }

    var monthlyRate = apy / 100 / 12;
    var balance = deposit;
    var totalContributed = deposit + monthly * 12 * years;
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
      ' at ' + apy + '% APY, your balance would be ' + fmtMoney(balance) + '.';
    finalEl.textContent = fmtMoney(balance);
    contributedEl.textContent = fmtMoney(totalContributed);
    interestEl.textContent = fmtMoney(totalInterest);
    apyUsedEl.textContent = apy + '% (entered by you)';
    tableEl.innerHTML = rows;
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
