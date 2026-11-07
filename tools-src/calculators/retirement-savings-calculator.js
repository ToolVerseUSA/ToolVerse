/* Retirement Savings Calculator — nest-egg target uses the 25x rule
   (target = desired annual spending in retirement x 25, from the 4% rule).
   All results are estimates. Growth uses monthly compounding.
   All math runs in the browser; no network, no storage, no input values
   sent anywhere. */
(function () {
  'use strict';
  var form = document.getElementById('retirement-savings-calculator-form');
  if (!form) return; // not on this page — safe global include

  var currentAgeEl = document.getElementById('ret-current-age');
  var retirementAgeEl = document.getElementById('ret-retirement-age');
  var savingsEl = document.getElementById('ret-savings');
  var monthlyEl = document.getElementById('ret-monthly');
  var returnEl = document.getElementById('ret-return');
  var spendingEl = document.getElementById('ret-spending');
  var errorEl = document.getElementById('retirement-savings-calculator-error');
  var ledeEl = document.getElementById('ret-lede');

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('retirement-savings-calculator', 'calculators', 'tool_use');
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

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function calculate() {
    hideError();
    var currentAge = parseInt(currentAgeEl.value, 10);
    var retirementAge = parseInt(retirementAgeEl.value, 10);
    var savings = parseFloat(savingsEl.value);
    var monthly = parseFloat(monthlyEl.value);
    var annualReturn = parseFloat(returnEl.value);
    var spending = parseFloat(spendingEl.value);

    if (isNaN(currentAge) || currentAge < 18 || currentAge > 100) { showError('Enter your current age (18 to 100).'); return; }
    if (isNaN(retirementAge) || retirementAge < 19 || retirementAge > 100) { showError('Enter a retirement age (19 to 100).'); return; }
    if (retirementAge <= currentAge) { showError('Retirement age must be higher than your current age.'); return; }
    if (isNaN(savings) || savings < 0) { showError('Enter current savings of 0 or more.'); return; }
    if (isNaN(monthly) || monthly < 0) { showError('Enter a monthly contribution of 0 or more.'); return; }
    if (isNaN(annualReturn) || annualReturn < 0 || annualReturn > 20) { showError('Enter an expected annual return between 0% and 20%.'); return; }
    if (isNaN(spending) || spending <= 0) { showError('Enter desired annual spending in retirement greater than $0.'); return; }

    var years = retirementAge - currentAge;
    var months = years * 12;
    var monthlyRate = annualReturn / 100 / 12;

    // Monthly compounding simulation.
    var bal = savings;
    var m;
    for (m = 0; m < months; m++) {
      bal = bal * (1 + monthlyRate) + monthly;
    }
    var projected = bal;
    var contributed = monthly * months;
    var growth = projected - savings - contributed;

    var target = spending * 25;
    var gap = target - projected; // positive = shortfall, negative = surplus

    // Monthly saving needed to reach the target, solving the future-value
    // formula: target = savings*(1+r)^n + PMT*[((1+r)^n - 1)/r].
    var needed = 0;
    if (gap > 0) {
      if (monthlyRate === 0) {
        needed = gap / months;
      } else {
        var growthFactor = Math.pow(1 + monthlyRate, months);
        needed = (target - savings * growthFactor) * monthlyRate / (growthFactor - 1);
        if (needed < 0) needed = 0;
      }
    }

    setText('ret-spending-out', fmtMoney(spending) + ' / year');
    setText('ret-target', fmtMoney(target));
    setText('ret-years', years + ' years');
    setText('ret-projected', fmtMoney(projected));
    setText('ret-contributed', fmtMoney(contributed));
    setText('ret-growth', fmtMoney(growth));
    setText('ret-gap', gap > 0
      ? 'Short by ' + fmtMoney(gap)
      : 'Surplus of ' + fmtMoney(-gap));
    setText('ret-needed', needed > 0 ? fmtMoney(needed) + ' / month' : '$0 / month — target reached');
    setText('ret-current-monthly', fmtMoney(monthly) + ' / month');

    if (gap > 0) {
      ledeEl.textContent = 'Your target is ' + fmtMoney(target) + ' (25 x ' + fmtMoney(spending) +
        ' a year). At your current pace you would reach about ' + fmtMoney(projected) +
        ', leaving a gap of ' + fmtMoney(gap) + '. Saving about ' + fmtMoney(needed) +
        ' a month would close it.';
    } else {
      ledeEl.textContent = 'Your target is ' + fmtMoney(target) + ' (25 x ' + fmtMoney(spending) +
        ' a year). At your current pace you would reach about ' + fmtMoney(projected) +
        ', which is ' + fmtMoney(-gap) + ' above your target — you are on track.';
    }

    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
