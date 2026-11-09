/* Salary to Hourly Calculator. Both directions, gross pay only. */
(function () {
  'use strict';
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('salary-to-hourly-calculator', 'calculators', 'tool_use');
    }
  }

  function fmtMoney(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  function fmtNum(value) {
    return value.toLocaleString('en-US');
  }

  function validHoursWeeks(hoursEl, weeksEl, errorEl) {
    var hours = parseFloat(hoursEl.value);
    var weeks = parseFloat(weeksEl.value);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      errorEl.textContent = 'Enter hours per week between 1 and 168.';
      errorEl.hidden = false;
      return null;
    }
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      errorEl.textContent = 'Enter weeks per year between 1 and 52.';
      errorEl.hidden = false;
      return null;
    }
    return { hours: hours, weeks: weeks };
  }

  var formA = document.getElementById('salary-to-hourly-calculator-form-a');
  if (formA) {
    var salaryEl = document.getElementById('salary-to-hourly-calculator-salary');
    var hoursAEl = document.getElementById('salary-to-hourly-calculator-hours-a');
    var weeksAEl = document.getElementById('salary-to-hourly-calculator-weeks-a');
    var errorAEl = document.getElementById('salary-to-hourly-calculator-error-a');
    var ledeAEl = document.getElementById('salary-to-hourly-calculator-lede-a');
    var hourlyEl = document.getElementById('salary-to-hourly-calculator-hourly');
    var weeklyAEl = document.getElementById('salary-to-hourly-calculator-weekly-a');
    var monthlyAEl = document.getElementById('salary-to-hourly-calculator-monthly-a');
    var hoursYearAEl = document.getElementById('salary-to-hourly-calculator-hours-year-a');
    formA.addEventListener('submit', function (e) {
      e.preventDefault();
      errorAEl.hidden = true;
      errorAEl.textContent = '';
      var salary = parseFloat(salaryEl.value);
      if (isNaN(salary) || salary <= 0) {
        errorAEl.textContent = 'Enter an annual salary above $0.';
        errorAEl.hidden = false;
        return;
      }
      var hw = validHoursWeeks(hoursAEl, weeksAEl, errorAEl);
      if (!hw) return;
      var totalHours = hw.hours * hw.weeks;
      var hourly = salary / totalHours;
      var weekly = salary / hw.weeks;
      var monthly = salary / 12;
      ledeAEl.textContent = fmtMoney(salary) + ' a year at ' + hw.hours + ' hours a week for ' +
        hw.weeks + ' weeks is ' + fmtMoney(hourly) + ' an hour.';
      hourlyEl.textContent = fmtMoney(hourly);
      weeklyAEl.textContent = fmtMoney(weekly);
      monthlyAEl.textContent = fmtMoney(monthly);
      hoursYearAEl.textContent = fmtNum(totalHours) + ' hours';
      trackUse();
    });
  }

  var formB = document.getElementById('salary-to-hourly-calculator-form-b');
  if (formB) {
    var rateEl = document.getElementById('salary-to-hourly-calculator-hourly-rate');
    var hoursBEl = document.getElementById('salary-to-hourly-calculator-hours-b');
    var weeksBEl = document.getElementById('salary-to-hourly-calculator-weeks-b');
    var errorBEl = document.getElementById('salary-to-hourly-calculator-error-b');
    var ledeBEl = document.getElementById('salary-to-hourly-calculator-lede-b');
    var annualEl = document.getElementById('salary-to-hourly-calculator-annual');
    var weeklyBEl = document.getElementById('salary-to-hourly-calculator-weekly-b');
    var monthlyBEl = document.getElementById('salary-to-hourly-calculator-monthly-b');
    var hoursYearBEl = document.getElementById('salary-to-hourly-calculator-hours-year-b');
    formB.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBEl.hidden = true;
      errorBEl.textContent = '';
      var rate = parseFloat(rateEl.value);
      if (isNaN(rate) || rate <= 0) {
        errorBEl.textContent = 'Enter an hourly rate above $0.';
        errorBEl.hidden = false;
        return;
      }
      var hw = validHoursWeeks(hoursBEl, weeksBEl, errorBEl);
      if (!hw) return;
      var totalHours = hw.hours * hw.weeks;
      var annual = rate * totalHours;
      var weekly = rate * hw.hours;
      var monthly = annual / 12;
      ledeBEl.textContent = fmtMoney(rate) + ' an hour at ' + hw.hours + ' hours a week for ' +
        hw.weeks + ' weeks is ' + fmtMoney(annual) + ' a year.';
      annualEl.textContent = fmtMoney(annual);
      weeklyBEl.textContent = fmtMoney(weekly);
      monthlyBEl.textContent = fmtMoney(monthly);
      hoursYearBEl.textContent = fmtNum(totalHours) + ' hours';
      trackUse();
    });
  }
})();
