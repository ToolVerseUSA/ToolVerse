/* Overtime Pay Calculator. Federal weekly rule: overtime at 1.5 times the regular rate for hours over 40 in a workweek. */
(function () {
  'use strict';
  var form = document.getElementById('overtime-pay-calculator-form');
  if (!form) return; // not on this page, safe global include

  var errorEl = document.getElementById('overtime-pay-calculator-error');
  var ledeEl = document.getElementById('overtime-pay-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('overtime-pay-calculator', 'calculators', 'tool_use');
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

  var rateEl = document.getElementById('overtime-pay-calculator-rate');
  var regularHoursEl = document.getElementById('overtime-pay-calculator-regular-hours');
  var overtimeHoursEl = document.getElementById('overtime-pay-calculator-overtime-hours');
  var overtimeRateEl = document.getElementById('overtime-pay-calculator-overtime-rate');
  var regularPayEl = document.getElementById('overtime-pay-calculator-regular-pay');
  var overtimePayEl = document.getElementById('overtime-pay-calculator-overtime-pay');
  var weeklyEl = document.getElementById('overtime-pay-calculator-weekly');
  var monthlyEl = document.getElementById('overtime-pay-calculator-monthly');
  var annualEl = document.getElementById('overtime-pay-calculator-annual');

  function calculate() {
    hideError();
    var rate = parseFloat(rateEl.value);
    var regularHours = parseFloat(regularHoursEl.value);
    var overtimeHours = parseFloat(overtimeHoursEl.value);
    if (isNaN(rate) || rate < 0) {
      showError('Enter a valid hourly rate (0 or more).');
      return;
    }
    if (isNaN(regularHours) || regularHours < 0 || regularHours > 40) {
      showError('Enter regular hours between 0 and 40 per week.');
      return;
    }
    if (isNaN(overtimeHours) || overtimeHours < 0) {
      showError('Enter valid overtime hours (0 or more).');
      return;
    }
    var overtimeRate = rate * 1.5;
    var regularPay = rate * regularHours;
    var overtimePay = overtimeRate * overtimeHours;
    var weekly = regularPay + overtimePay;
    var monthly = weekly * 52 / 12;
    var annual = weekly * 52;
    ledeEl.textContent = 'At ' + fmtMoney(rate) + ' per hour with ' + overtimeHours +
      ' overtime hours, your total pay is ' + fmtMoney(weekly) + ' per week.';
    overtimeRateEl.textContent = fmtMoney(overtimeRate) + ' per hour';
    regularPayEl.textContent = fmtMoney(regularPay) + ' per week';
    overtimePayEl.textContent = fmtMoney(overtimePay) + ' per week';
    weeklyEl.textContent = fmtMoney(weekly);
    monthlyEl.textContent = fmtMoney(monthly);
    annualEl.textContent = fmtMoney(annual);
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
