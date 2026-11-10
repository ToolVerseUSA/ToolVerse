/* Federal Income Tax Estimator. Taxable income is gross income minus the
   standard deduction for the filing status and year, then taxed bracket by
   bracket. 2026 brackets and standard deduction: IRS Revenue Procedure
   2025-32. 2027 brackets and standard deduction: IRS Revenue Procedure
   2026-35, published November 5, 2026 with news release IR-2026-133.
   Rates in both years: 10%, 12%, 22%, 24%, 32%, 35%, 37%. Federal tax
   only, standard deduction only, no credits. Estimate only, not tax advice. */
(function () {
  'use strict';
  var form = document.getElementById('federal-income-tax-estimator-form');
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
  var STATUS_LABEL = { single: 'Single', mfj: 'Married filing jointly', hoh: 'Head of household' };

  var errorEl = document.getElementById('federal-income-tax-estimator-error');
  var ledeEl = document.getElementById('federal-income-tax-estimator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('federal-income-tax-estimator', 'calculators', 'tool_use');
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

  var yearEl = document.getElementById('federal-income-tax-estimator-year');
  var filingEl = document.getElementById('federal-income-tax-estimator-filing-status');
  var grossEl = document.getElementById('federal-income-tax-estimator-gross');
  var grossOutEl = document.getElementById('federal-income-tax-estimator-gross-out');
  var deductionEl = document.getElementById('federal-income-tax-estimator-deduction');
  var taxableEl = document.getElementById('federal-income-tax-estimator-taxable');
  var taxEl = document.getElementById('federal-income-tax-estimator-tax');
  var afterTaxEl = document.getElementById('federal-income-tax-estimator-after-tax');
  var marginalEl = document.getElementById('federal-income-tax-estimator-marginal');
  var effectiveEl = document.getElementById('federal-income-tax-estimator-effective');
  var monthlyEl = document.getElementById('federal-income-tax-estimator-monthly');

  function computeTax(year, status, taxable) {
    var brackets = BRACKETS[year][status];
    var tax = 0;
    var marginal = 0;
    var prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      if (taxable <= prev) break;
      var top = brackets[i][0];
      var rate = brackets[i][1];
      var inBracket = Math.min(taxable, top) - prev;
      if (inBracket > 0) {
        tax += inBracket * rate;
        marginal = rate;
      }
      prev = top;
    }
    return { tax: tax, marginal: marginal };
  }

  function calculate() {
    hideError();
    var year = parseInt(yearEl.value, 10);
    var status = filingEl.value;
    var gross = parseFloat(grossEl.value);
    if (isNaN(gross) || gross < 0) {
      showError('Enter a valid annual gross income (0 or more).');
      return;
    }
    if (!BRACKETS[year] || !BRACKETS[year][status]) {
      showError('Choose a valid tax year and filing status.');
      return;
    }
    var deduction = STANDARD_DEDUCTION[year][status];
    var taxable = Math.max(0, gross - deduction);
    var result = computeTax(year, status, taxable);
    var tax = result.tax;
    var afterTax = gross - tax;
    var effective = gross > 0 ? (tax / gross) * 100 : 0;
    ledeEl.textContent = 'As a ' + STATUS_LABEL[status].toLowerCase() + ' filer in ' + year +
      ' with ' + fmtMoney(gross) + ' of gross income, your estimated federal tax is ' +
      fmtMoney(tax) + ', a ' + fmtPct(effective) + ' effective rate.';
    grossOutEl.textContent = fmtMoney(gross);
    deductionEl.textContent = fmtMoney(deduction);
    taxableEl.textContent = fmtMoney(taxable);
    taxEl.textContent = fmtMoney(tax);
    afterTaxEl.textContent = fmtMoney(afterTax);
    marginalEl.textContent = fmtPct(result.marginal * 100);
    effectiveEl.textContent = fmtPct(effective);
    monthlyEl.textContent = fmtMoney(afterTax / 12);
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
