/* Side Hustle Tax Calculator — self-employment tax estimate (IRS Schedule SE).
   SE tax is 15.3% (12.4% Social Security + 2.9% Medicare) on 92.35% of net
   self-employment earnings. The 12.4% part stops at the wage base ($184,500
   for 2026, $176,100 for 2025); the 2.9% part has no cap. No SE tax is owed
   when net earnings are under $400. One-half of SE tax is deductible from
   income tax. The extra 0.9% Medicare tax is only flagged, not calculated
   (no full Form 8959 logic). Federal income tax is separate and is not
   calculated here. Estimate only — not tax advice. */
(function () {
  'use strict';
  var form = document.getElementById('side-hustle-tax-calculator-form');
  if (!form) return; // not on this page — safe global include

  var WAGE_BASE = { 2025: 176100, 2026: 184500 };
  var ADDITIONAL_MEDICARE_THRESHOLD = { single: 200000, mfj: 250000 };

  var grossEl = document.getElementById('side-hustle-tax-calculator-gross');
  var expensesEl = document.getElementById('side-hustle-tax-calculator-expenses');
  var yearEl = document.getElementById('side-hustle-tax-calculator-year');
  var filingEl = document.getElementById('side-hustle-tax-calculator-filing-status');
  var errorEl = document.getElementById('side-hustle-tax-calculator-error');
  var ledeEl = document.getElementById('side-hustle-tax-calculator-lede');
  var netEl = document.getElementById('side-hustle-tax-calculator-net');
  var baseEl = document.getElementById('side-hustle-tax-calculator-base');
  var yearLabelEl = document.getElementById('side-hustle-tax-calculator-year-label');
  var wageBaseEl = document.getElementById('side-hustle-tax-calculator-wage-base');
  var ssEl = document.getElementById('side-hustle-tax-calculator-ss');
  var medicareEl = document.getElementById('side-hustle-tax-calculator-medicare');
  var totalEl = document.getElementById('side-hustle-tax-calculator-total');
  var halfEl = document.getElementById('side-hustle-tax-calculator-half');
  var rateEl = document.getElementById('side-hustle-tax-calculator-rate');
  var quarterlyEl = document.getElementById('side-hustle-tax-calculator-quarterly');
  var additionalEl = document.getElementById('side-hustle-tax-calculator-additional');

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('side-hustle-tax-calculator', 'calculators', 'tool_use');
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
    var gross = parseFloat(grossEl.value);
    var expenses = parseFloat(expensesEl.value);
    var year = yearEl.value;
    var filingStatus = filingEl.value;

    if (isNaN(gross) || gross < 0) {
      showError('Enter a valid gross income (0 or more).');
      return;
    }
    if (isNaN(expenses) || expenses < 0) {
      showError('Enter valid business expenses (0 or more).');
      return;
    }
    if (expenses > gross) {
      showError('Business expenses cannot be more than your gross income.');
      return;
    }

    var net = gross - expenses;
    var wageBase = WAGE_BASE[year] || WAGE_BASE[2026];
    yearLabelEl.textContent = year;
    wageBaseEl.textContent = fmtMoney(wageBase);
    netEl.textContent = fmtMoney(net);

    if (net < 400) {
      baseEl.textContent = fmtMoney(0);
      ssEl.textContent = fmtMoney(0);
      medicareEl.textContent = fmtMoney(0);
      totalEl.textContent = fmtMoney(0);
      halfEl.textContent = fmtMoney(0);
      rateEl.textContent = '0%';
      quarterlyEl.textContent = fmtMoney(0);
      additionalEl.hidden = true;
      ledeEl.textContent = 'Your net profit is ' + fmtMoney(net) +
        ', which is under $400 — no self-employment tax is owed on it. ' +
        'Federal income tax rules still apply; see the note below.';
      trackUse();
      return;
    }

    var base = net * 0.9235;
    var ssTax = Math.min(base, wageBase) * 0.124;
    var medicareTax = base * 0.029;
    var total = ssTax + medicareTax;
    var half = total / 2;
    var effectiveRate = total / net * 100;
    var quarterly = total / 4;

    baseEl.textContent = fmtMoney(base);
    ssEl.textContent = fmtMoney(ssTax);
    medicareEl.textContent = fmtMoney(medicareTax);
    totalEl.textContent = fmtMoney(total);
    halfEl.textContent = fmtMoney(half);
    rateEl.textContent = effectiveRate.toFixed(2) + '%';
    quarterlyEl.textContent = fmtMoney(quarterly);

    var threshold = ADDITIONAL_MEDICARE_THRESHOLD[filingStatus] || 200000;
    additionalEl.hidden = net <= threshold;

    ledeEl.textContent = 'On ' + fmtMoney(net) + ' of net profit in ' + year +
      ', your estimated self-employment tax is ' + fmtMoney(total) +
      ' — about ' + fmtMoney(quarterly) + ' per quarter.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
