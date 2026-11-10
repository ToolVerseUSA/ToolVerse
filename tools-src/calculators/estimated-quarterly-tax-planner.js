/* Estimated Quarterly Tax Planner, tax year 2026. Self-employment tax is
   15.3% (12.4% Social Security on the first $184,500 plus 2.9% Medicare
   with no cap) applied to 92.35% of net self-employment earnings, per IRS
   Schedule SE. The Social Security wage base of $184,500 for 2026 was set
   by the Social Security Administration. Half of SE tax is deductible.
   Income tax uses the 2026 standard deduction and brackets from IRS
   Revenue Procedure 2025-32. Due dates and safe harbor: IRS Form 1040-ES.
   The extra 0.9% Medicare tax is only flagged, not calculated. Estimate
   only, not tax advice. */
(function () {
  'use strict';
  var form = document.getElementById('estimated-quarterly-tax-planner-form');
  if (!form) return; // not on this page, safe global include

  var WAGE_BASE_2026 = 184500;
  var SS_RATE = 0.124;
  var MEDICARE_RATE = 0.029;
  var SE_BASE_RATE = 0.9235;
  var SE_MIN_EARNINGS = 400;
  var ADDITIONAL_MEDICARE_THRESHOLD = { single: 200000, mfj: 250000, hoh: 200000 };

  /* 2026 federal brackets. Each entry is [top of bracket, rate]. */
  var BRACKETS_2026 = {
    single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
    mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
    hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]]
  };
  var STANDARD_DEDUCTION_2026 = { single: 16100, mfj: 32200, hoh: 24150 };
  var DUE_DATES = [
    ['1st payment', 'April 15, 2026 (Wednesday)'],
    ['2nd payment', 'June 15, 2026 (Monday)'],
    ['3rd payment', 'September 15, 2026 (Tuesday)'],
    ['4th payment', 'January 15, 2027 (Friday)']
  ];

  var errorEl = document.getElementById('estimated-quarterly-tax-planner-error');
  var ledeEl = document.getElementById('estimated-quarterly-tax-planner-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('estimated-quarterly-tax-planner', 'calculators', 'tool_use');
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

  var netEl = document.getElementById('estimated-quarterly-tax-planner-net-income');
  var filingEl = document.getElementById('estimated-quarterly-tax-planner-filing-status');
  var otherEl = document.getElementById('estimated-quarterly-tax-planner-other-income');
  var baseEl = document.getElementById('estimated-quarterly-tax-planner-base');
  var ssEl = document.getElementById('estimated-quarterly-tax-planner-ss');
  var medicareEl = document.getElementById('estimated-quarterly-tax-planner-medicare');
  var seTaxEl = document.getElementById('estimated-quarterly-tax-planner-se-tax');
  var halfEl = document.getElementById('estimated-quarterly-tax-planner-half');
  var taxableEl = document.getElementById('estimated-quarterly-tax-planner-taxable');
  var incomeTaxEl = document.getElementById('estimated-quarterly-tax-planner-income-tax');
  var totalEl = document.getElementById('estimated-quarterly-tax-planner-total');
  var quarterlyEl = document.getElementById('estimated-quarterly-tax-planner-quarterly');
  var additionalEl = document.getElementById('estimated-quarterly-tax-planner-additional');
  var tableEl = document.getElementById('estimated-quarterly-tax-planner-table');

  function computeIncomeTax(status, taxable) {
    var brackets = BRACKETS_2026[status];
    var tax = 0;
    var prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      if (taxable <= prev) break;
      var inBracket = Math.min(taxable, brackets[i][0]) - prev;
      if (inBracket > 0) tax += inBracket * brackets[i][1];
      prev = brackets[i][0];
    }
    return tax;
  }

  function calculate() {
    hideError();
    var net = parseFloat(netEl.value);
    var status = filingEl.value;
    var other = otherEl.value === '' ? 0 : parseFloat(otherEl.value);
    if (isNaN(net) || net < 0) {
      showError('Enter a valid net self-employment income (0 or more).');
      return;
    }
    if (isNaN(other) || other < 0) {
      showError('Enter a valid other income amount (0 or more).');
      return;
    }
    if (!BRACKETS_2026[status]) {
      showError('Choose a valid filing status.');
      return;
    }
    var base = 0;
    var ss = 0;
    var medicare = 0;
    var seTax = 0;
    if (net >= SE_MIN_EARNINGS) {
      base = net * SE_BASE_RATE;
      ss = Math.min(base, WAGE_BASE_2026) * SS_RATE;
      medicare = base * MEDICARE_RATE;
      seTax = ss + medicare;
    }
    var half = seTax / 2;
    var taxable = Math.max(0, net + other - half - STANDARD_DEDUCTION_2026[status]);
    var incomeTax = computeIncomeTax(status, taxable);
    var total = seTax + incomeTax;
    var quarterly = total / 4;
    ledeEl.textContent = 'Your estimated total tax for 2026 is ' + fmtMoney(total) +
      ' (' + fmtMoney(seTax) + ' self-employment tax plus ' + fmtMoney(incomeTax) +
      ' income tax), so each quarterly payment is ' + fmtMoney(quarterly) + '.';
    baseEl.textContent = fmtMoney(base);
    ssEl.textContent = fmtMoney(ss);
    medicareEl.textContent = fmtMoney(medicare);
    seTaxEl.textContent = fmtMoney(seTax);
    halfEl.textContent = fmtMoney(half);
    taxableEl.textContent = fmtMoney(taxable);
    incomeTaxEl.textContent = fmtMoney(incomeTax);
    totalEl.textContent = fmtMoney(total);
    quarterlyEl.textContent = fmtMoney(quarterly);
    var threshold = ADDITIONAL_MEDICARE_THRESHOLD[status];
    additionalEl.hidden = !((net + other) > threshold);
    var rows = '';
    for (var i = 0; i < DUE_DATES.length; i++) {
      rows += '<tr><td>' + DUE_DATES[i][0] + '</td><td>' + DUE_DATES[i][1] +
        '</td><td>' + fmtMoney(quarterly) + '</td></tr>';
    }
    tableEl.innerHTML = rows;
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
