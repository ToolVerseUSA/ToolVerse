/* Business Debt Capacity Calculator. Max annual debt service is NOI / DSCR. Max loan is the present value of the max monthly payment over the term. */
(function () {
  'use strict';
  var form = document.getElementById('business-debt-capacity-calculator-form');
  if (!form) return; // not on this page, safe global include

  var errorEl = document.getElementById('business-debt-capacity-calculator-error');
  var ledeEl = document.getElementById('business-debt-capacity-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('business-debt-capacity-calculator', 'calculators', 'tool_use');
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

  var noiEl = document.getElementById('business-debt-capacity-calculator-noi');
  var rateEl = document.getElementById('business-debt-capacity-calculator-rate');
  var termYearsEl = document.getElementById('business-debt-capacity-calculator-term-years');
  var dscrEl = document.getElementById('business-debt-capacity-calculator-dscr');
  var annualServiceEl = document.getElementById('business-debt-capacity-calculator-annual-service');
  var monthlyPaymentEl = document.getElementById('business-debt-capacity-calculator-monthly-payment');
  var maxLoanEl = document.getElementById('business-debt-capacity-calculator-max-loan');
  var dscrUsedEl = document.getElementById('business-debt-capacity-calculator-dscr-used');

  function calculate() {
    hideError();
    var noi = parseFloat(noiEl.value);
    var rate = parseFloat(rateEl.value);
    var termYears = parseFloat(termYearsEl.value);
    var dscr = parseFloat(dscrEl.value);
    if (isNaN(noi) || noi <= 0) {
      showError('Enter a valid annual net operating income (more than 0).');
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 30) {
      showError('Enter a valid annual interest rate between 0% and 30%.');
      return;
    }
    if (isNaN(termYears) || termYears < 1 || termYears > 30) {
      showError('Enter a valid loan term between 1 and 30 years.');
      return;
    }
    if (isNaN(dscr) || dscr < 0.1) {
      showError('Enter a valid target DSCR (0.1 or more).');
      return;
    }
    var annualService = noi / dscr;
    var monthlyPayment = annualService / 12;
    var months = Math.round(termYears * 12);
    var monthlyRate = rate / 100 / 12;
    var maxLoan;
    if (monthlyRate === 0) {
      maxLoan = monthlyPayment * months;
    } else {
      maxLoan = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
    }
    ledeEl.textContent = 'With a DSCR of ' + dscr + ', your income supports a loan of up to ' +
      fmtMoney(maxLoan) + ', with a max monthly payment of ' + fmtMoney(monthlyPayment) + '.';
    annualServiceEl.textContent = fmtMoney(annualService) + ' per year';
    monthlyPaymentEl.textContent = fmtMoney(monthlyPayment) + ' per month';
    maxLoanEl.textContent = fmtMoney(maxLoan);
    dscrUsedEl.textContent = dscr.toFixed(2);
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
