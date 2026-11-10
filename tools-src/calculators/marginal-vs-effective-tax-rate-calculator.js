/* Marginal vs Effective Tax Rate Calculator. Same bracket tables and standard
   deduction as the federal income tax estimator. 2026 figures: IRS Revenue
   Procedure 2025-32. 2027 figures: IRS Revenue Procedure 2026-35, published
   November 5, 2026 with news release IR-2026-133. Rates in both years:
   10%, 12%, 22%, 24%, 32%, 35%, 37%. Federal tax only, standard deduction
   only, no credits. Estimate only, not tax advice. */
(function () {
  'use strict';
  var form = document.getElementById('marginal-vs-effective-tax-rate-calculator-form');
  if (!form) return; // not on this page, safe global include

  /* Bracket tops per year and filing status. Each entry is [top of bracket, rate]. */
  var BRACKETS = {
    2026: {
      single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
      mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
      hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]]
    },
    2027: {
      single: [[12800, 0.10], [52025, 0.12], [109125, 0.22], [208325, 0.24], [264550, 0.32], [661375, 0.35], [Infinity, 0.37]],
      mfj: [[25600, 0.10], [104050, 0.12], [218250, 0.22], [416650, 0.24], [529100, 0.32], [793650, 0.35], [Infinity, 0.37]],
      hoh: [[18250, 0.10], [69650, 0.12], [109100, 0.22], [208300, 0.24], [264550, 0.32], [661350, 0.35], [Infinity, 0.37]]
    }
  };
  var STANDARD_DEDUCTION = {
    2026: { single: 16100, mfj: 32200, hoh: 24150 },
    2027: { single: 16600, mfj: 33200, hoh: 24925 }
  };

  var errorEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-error');
  var ledeEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('marginal-vs-effective-tax-rate-calculator', 'calculators', 'tool_use');
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
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function fmtPct(value) {
    return value.toFixed(1) + '%';
  }

  var incomeEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-income');
  var filingEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-filing-status');
  var yearEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-year');
  var grossEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-gross');
  var deductionEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-deduction');
  var taxableEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-taxable');
  var taxEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-tax');
  var marginalEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-marginal');
  var effectiveEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-effective');
  var afterTaxEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-after-tax');
  var tableEl = document.getElementById('marginal-vs-effective-tax-rate-calculator-table');

  function calculate() {
    hideError();
    var income = parseFloat(incomeEl.value);
    var status = filingEl.value;
    var year = parseInt(yearEl.value, 10);
    if (isNaN(income) || income < 0) {
      showError('Enter a valid annual gross income (0 or more).');
      return;
    }
    if (!BRACKETS[year] || !BRACKETS[year][status]) {
      showError('Choose a valid tax year and filing status.');
      return;
    }
    var deduction = STANDARD_DEDUCTION[year][status];
    var taxable = Math.max(0, income - deduction);
    var brackets = BRACKETS[year][status];
    var tax = 0;
    var marginal = 0;
    var prev = 0;
    var rows = '';
    for (var i = 0; i < brackets.length; i++) {
      if (taxable <= prev) break;
      var top = brackets[i][0];
      var rate = brackets[i][1];
      var inBracket = Math.min(taxable, top) - prev;
      if (inBracket > 0) {
        var bracketTax = inBracket * rate;
        tax += bracketTax;
        marginal = rate;
        var label = top === Infinity
          ? 'Over ' + fmtMoney(prev)
          : fmtMoney(prev) + ' to ' + fmtMoney(top);
        rows += '<tr><td>' + label + ' (' + (rate * 100) + '%)</td><td>' +
          fmtMoney(inBracket) + '</td><td>' + fmtMoney(bracketTax) + '</td></tr>';
      }
      prev = top;
    }
    if (rows === '') {
      rows = '<tr><td colspan="3">No taxable income, so no income falls in any bracket.</td></tr>';
    }
    var effective = income > 0 ? (tax / income) * 100 : 0;
    ledeEl.textContent = 'Your marginal rate is ' + fmtPct(marginal * 100) +
      ' and your effective rate is ' + fmtPct(effective) +
      '. Only the income inside each bracket is taxed at that bracket\u2019s rate.';
    grossEl.textContent = fmtMoney(income);
    deductionEl.textContent = fmtMoney(deduction);
    taxableEl.textContent = fmtMoney(taxable);
    taxEl.textContent = fmtMoney(tax);
    marginalEl.textContent = fmtPct(marginal * 100);
    effectiveEl.textContent = fmtPct(effective);
    afterTaxEl.textContent = fmtMoney(income - tax);
    tableEl.innerHTML = rows;
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
