/* Pay Raise Calculator. Enter a raise percent or a new pay amount. Conversions assume a 40 hour week and 52 weeks a year. */
(function () {
  'use strict';
  var form = document.getElementById('pay-raise-calculator-form');
  if (!form) return; // not on this page, safe global include

  var errorEl = document.getElementById('pay-raise-calculator-error');
  var ledeEl = document.getElementById('pay-raise-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('pay-raise-calculator', 'calculators', 'tool_use');
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
  function fmtPct(value) {
    return value.toFixed(2) + '%';
  }

  var payTypeEl = document.getElementById('pay-raise-calculator-pay-type');
  var currentPayEl = document.getElementById('pay-raise-calculator-current-pay');
  var raisePercentEl = document.getElementById('pay-raise-calculator-raise-percent');
  var newPayEl = document.getElementById('pay-raise-calculator-new-pay');
  var newHourlyEl = document.getElementById('pay-raise-calculator-new-hourly');
  var newWeeklyEl = document.getElementById('pay-raise-calculator-new-weekly');
  var newMonthlyEl = document.getElementById('pay-raise-calculator-new-monthly');
  var newAnnualEl = document.getElementById('pay-raise-calculator-new-annual');
  var raiseHourlyEl = document.getElementById('pay-raise-calculator-raise-hourly');
  var raiseAnnualEl = document.getElementById('pay-raise-calculator-raise-annual');
  var percentChangeEl = document.getElementById('pay-raise-calculator-percent-change');
  var previousAnnualEl = document.getElementById('pay-raise-calculator-previous-annual');

  function toHourly(pay, type) {
    return type === 'annual' ? pay / 52 / 40 : pay;
  }
  function toAnnual(hourly) {
    return hourly * 40 * 52;
  }

  function calculate() {
    hideError();
    var payType = payTypeEl.value;
    var currentPay = parseFloat(currentPayEl.value);
    var raisePercent = parseFloat(raisePercentEl.value);
    var newPay = parseFloat(newPayEl.value);
    if (isNaN(currentPay) || currentPay <= 0) {
      showError('Enter a valid current pay (more than 0).');
      return;
    }
    var hasPercent = !isNaN(raisePercent);
    var hasNewPay = !isNaN(newPay);
    if (!hasPercent && !hasNewPay) {
      showError('Enter either a raise percent or a new pay amount.');
      return;
    }
    if (hasPercent && raisePercent < 0) {
      showError('Enter a valid raise percent (0 or more).');
      return;
    }
    if (hasNewPay && newPay <= 0) {
      showError('Enter a valid new pay amount (more than 0).');
      return;
    }
    var currentHourly = toHourly(currentPay, payType);
    var newHourly;
    var percentChange;
    if (hasNewPay) {
      // New pay amount wins when both are entered.
      var newHourlyFromPay = toHourly(newPay, payType);
      percentChange = (newHourlyFromPay - currentHourly) / currentHourly * 100;
      newHourly = newHourlyFromPay;
    } else {
      percentChange = raisePercent;
      newHourly = currentHourly * (1 + raisePercent / 100);
    }
    var currentAnnual = toAnnual(currentHourly);
    var newAnnual = toAnnual(newHourly);
    var newWeekly = newHourly * 40;
    var newMonthly = newAnnual / 12;
    var raiseHourly = newHourly - currentHourly;
    var raiseAnnual = newAnnual - currentAnnual;
    ledeEl.textContent = 'Your new pay is ' + fmtMoney(newHourly) + ' per hour, ' +
      fmtMoney(newAnnual) + ' per year, a ' + fmtPct(percentChange) + ' change.';
    newHourlyEl.textContent = fmtMoney(newHourly);
    newWeeklyEl.textContent = fmtMoney(newWeekly);
    newMonthlyEl.textContent = fmtMoney(newMonthly);
    newAnnualEl.textContent = fmtMoney(newAnnual);
    raiseHourlyEl.textContent = fmtMoney(raiseHourly);
    raiseAnnualEl.textContent = fmtMoney(raiseAnnual);
    percentChangeEl.textContent = fmtPct(percentChange);
    previousAnnualEl.textContent = fmtMoney(currentAnnual);
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
