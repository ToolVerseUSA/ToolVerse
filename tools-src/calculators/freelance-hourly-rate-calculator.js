/* Freelance Hourly Rate Calculator. Gross needed equals (income plus expenses) divided by (1 minus tax rate). */
(function () {
  'use strict';
  var form = document.getElementById('freelance-hourly-rate-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('freelance-hourly-rate-calculator-error');
  var ledeEl = document.getElementById('freelance-hourly-rate-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('freelance-hourly-rate-calculator', 'calculators', 'tool_use');
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

  var incomeEl = document.getElementById('freelance-hourly-rate-calculator-income');
  var hoursEl = document.getElementById('freelance-hourly-rate-calculator-hours');
  var weeksEl = document.getElementById('freelance-hourly-rate-calculator-weeks');
  var expensesEl = document.getElementById('freelance-hourly-rate-calculator-expenses');
  var taxEl = document.getElementById('freelance-hourly-rate-calculator-tax');
  var hourlyEl = document.getElementById('freelance-hourly-rate-calculator-hourly');
  var dayEl = document.getElementById('freelance-hourly-rate-calculator-day');
  var hourly80El = document.getElementById('freelance-hourly-rate-calculator-hourly80');
  var day80El = document.getElementById('freelance-hourly-rate-calculator-day80');
  var billHoursEl = document.getElementById('freelance-hourly-rate-calculator-billhours');
  var grossEl = document.getElementById('freelance-hourly-rate-calculator-gross');
  var expensesOutEl = document.getElementById('freelance-hourly-rate-calculator-expenses-out');
  var taxAmountEl = document.getElementById('freelance-hourly-rate-calculator-taxamount');

  function calculate() {
    hideError();
    var income = parseFloat(incomeEl.value);
    var hours = parseFloat(hoursEl.value);
    var weeks = parseInt(weeksEl.value, 10);
    var expenses = parseFloat(expensesEl.value);
    var tax = parseFloat(taxEl.value);
    if (isNaN(income) || income < 0) {
      showError('Enter a valid target annual income (0 or more).');
      return;
    }
    if (isNaN(hours) || hours < 1 || hours > 80) {
      showError('Enter billable hours per week between 1 and 80.');
      return;
    }
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      showError('Enter working weeks per year between 1 and 52.');
      return;
    }
    if (isNaN(expenses) || expenses < 0) {
      showError('Enter valid annual business expenses (0 or more).');
      return;
    }
    if (isNaN(tax) || tax < 0 || tax >= 100) {
      showError('Enter a tax set-aside between 0% and 99%.');
      return;
    }
    var billHours = hours * weeks;
    var gross = (income + expenses) / (1 - tax / 100);
    var hourly = gross / billHours;
    var hourly80 = gross / (billHours * 0.8);
    hourlyEl.textContent = fmtMoney(hourly) + ' per hour';
    dayEl.textContent = fmtMoney(hourly * 8) + ' per day';
    hourly80El.textContent = fmtMoney(hourly80) + ' per hour';
    day80El.textContent = fmtMoney(hourly80 * 8) + ' per day';
    billHoursEl.textContent = fmtNum(billHours) + ' hours';
    grossEl.textContent = fmtMoney(gross);
    expensesOutEl.textContent = fmtMoney(expenses);
    taxAmountEl.textContent = fmtMoney(gross * tax / 100) + ' (' + tax + '% of gross)';
    ledeEl.textContent = 'To keep ' + fmtMoney(income) + ' after ' + fmtMoney(expenses) +
      ' of expenses and a ' + tax + '% tax set-aside, charge at least ' + fmtMoney(hourly) + ' per hour.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
