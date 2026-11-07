/* 401(k) Contribution Calculator — IRS limits:
   2026 CONFIRMED by IRS Notice 2025-67: $24,500 standard, $8,000 catch-up
   age 50+, $11,250 super catch-up ages 60-63.
   2027 PROJECTED (not yet IRS-confirmed; notice expected Nov 2026):
   $25,500 / $8,500 / $11,750. Never present 2027 as confirmed.
   All math runs in the browser; no network, no storage, no input values
   sent anywhere. Growth uses monthly compounding. */
(function () {
  'use strict';
  var form = document.getElementById('401k-contribution-calculator-form');
  if (!form) return; // not on this page — safe global include

  var LIMITS = {
    '2026': { base: 24500, catchup: 8000, super: 11250, confirmed: true },
    '2027': { base: 25500, catchup: 8500, super: 11750, confirmed: false }
  };

  var yearEl = document.getElementById('k401-year');
  var ageEl = document.getElementById('k401-age');
  var salaryEl = document.getElementById('k401-salary');
  var modeEl = document.getElementById('k401-contribution-mode');
  var contributionEl = document.getElementById('k401-contribution');
  var paychecksEl = document.getElementById('k401-paychecks');
  var matchPercentEl = document.getElementById('k401-match-percent');
  var matchCapEl = document.getElementById('k401-match-cap');
  var balanceEl = document.getElementById('k401-balance');
  var yearsEl = document.getElementById('k401-years');
  var returnEl = document.getElementById('k401-return');
  var errorEl = document.getElementById('401k-contribution-calculator-error');
  var ledeEl = document.getElementById('k401-lede');
  var noteEl = document.getElementById('k401-note');
  var tableBodyEl = document.getElementById('k401-table-body');

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('401k-contribution-calculator', 'calculators', 'tool_use');
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

  function effectiveLimit(yearKey, age) {
    var lim = LIMITS[yearKey];
    if (age >= 60 && age <= 63) return { limit: lim.base + lim.super, catchupLabel: 'Super catch-up (ages 60–63): ' + fmtMoney(lim.super) };
    if (age >= 50) return { limit: lim.base + lim.catchup, catchupLabel: 'Catch-up (age 50+): ' + fmtMoney(lim.catchup) };
    return { limit: lim.base, catchupLabel: 'None — catch-up starts at age 50' };
  }

  function calculate() {
    hideError();
    var yearKey = yearEl.value;
    var lim = LIMITS[yearKey];
    var age = parseInt(ageEl.value, 10);
    var salary = parseFloat(salaryEl.value);
    var contribution = parseFloat(contributionEl.value);
    var paychecks = parseInt(paychecksEl.value, 10);
    var matchPercent = parseFloat(matchPercentEl.value);
    var matchCap = parseFloat(matchCapEl.value);
    var balance = parseFloat(balanceEl.value);
    var years = parseInt(yearsEl.value, 10);
    var annualReturn = parseFloat(returnEl.value);

    if (isNaN(age) || age < 18 || age > 100) { showError('Enter your age (18 to 100).'); return; }
    if (isNaN(salary) || salary <= 0) { showError('Enter an annual salary greater than $0.'); return; }
    if (isNaN(contribution) || contribution < 0) { showError('Enter a contribution of 0 or more.'); return; }
    if (modeEl.value === 'percent' && contribution > 100) { showError('A contribution percent cannot be more than 100%.'); return; }
    if (isNaN(matchPercent) || matchPercent < 0 || matchPercent > 100) { showError('Enter an employer match between 0% and 100%.'); return; }
    if (isNaN(matchCap) || matchCap < 0 || matchCap > 100) { showError('Enter a match cap between 0% and 100% of your salary.'); return; }
    if (isNaN(balance) || balance < 0) { showError('Enter a current balance of 0 or more.'); return; }
    if (isNaN(years) || years < 1 || years > 50) { showError('Enter years until retirement (1 to 50).'); return; }
    if (isNaN(annualReturn) || annualReturn < 0 || annualReturn > 20) { showError('Enter an expected annual return between 0% and 20%.'); return; }

    var eff = effectiveLimit(yearKey, age);
    var limit = eff.limit;

    var rawYearly = modeEl.value === 'percent'
      ? salary * contribution / 100
      : contribution * paychecks;
    var capped = rawYearly > limit;
    var yourYearly = Math.min(rawYearly, limit);

    var matchedBase = Math.min(yourYearly, salary * matchCap / 100);
    var matchYearly = matchedBase * matchPercent / 100;
    var totalYearly = yourYearly + matchYearly;
    var totalMonthly = totalYearly / 12;

    // Monthly compounding simulation, tracking each year's end balance.
    var monthlyRate = annualReturn / 100 / 12;
    var bal = balance;
    var yearRows = [];
    var y, m, yearStart, yearContrib, yearGrowth;
    for (y = 1; y <= years; y++) {
      yearStart = bal;
      yearContrib = 0;
      for (m = 0; m < 12; m++) {
        bal = bal * (1 + monthlyRate) + totalMonthly;
        yearContrib += totalMonthly;
      }
      yearGrowth = bal - yearStart - yearContrib;
      yearRows.push({ year: y, balance: bal, contributed: yearContrib, growth: yearGrowth });
    }
    var projected = bal;
    var youTotal = yourYearly * years;
    var employerTotal = matchYearly * years;
    var growthTotal = projected - balance - youTotal - employerTotal;

    setText('k401-limit-year', yearKey);
    setText('k401-your-yearly', fmtMoney(yourYearly));
    setText('k401-limit', fmtMoney(limit) + (lim.confirmed ? '' : ' (projected)'));
    setText('k401-headroom', fmtMoney(limit - yourYearly));
    setText('k401-catchup', eff.catchupLabel);
    setText('k401-match-yearly', fmtMoney(matchYearly));
    setText('k401-total-yearly', fmtMoney(totalYearly));
    setText('k401-total-monthly', fmtMoney(totalMonthly));
    setText('k401-projected', fmtMoney(projected));
    setText('k401-you-total', fmtMoney(youTotal));
    setText('k401-employer-total', fmtMoney(employerTotal));
    setText('k401-growth', fmtMoney(growthTotal));

    ledeEl.textContent = 'At ' + fmtMoney(yourYearly) + ' a year plus ' + fmtMoney(matchYearly) +
      ' in employer match, your balance could grow to about ' + fmtMoney(projected) +
      ' in ' + years + ' years.';

    if (capped) {
      noteEl.textContent = 'Note: your chosen contribution (' + fmtMoney(rawYearly) +
        ' a year) is above the ' + yearKey + ' IRS limit of ' + fmtMoney(limit) +
        ', so this projection caps your contribution at the limit.';
      noteEl.hidden = false;
    } else if (yourYearly < salary * matchCap / 100) {
      noteEl.textContent = 'Heads up: you are contributing less than the ' + matchCap +
        '% of salary your employer matches, so you are missing out on some free match money.';
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
      noteEl.textContent = '';
    }

    // Year-by-year table: first 5 years plus the final year.
    var shown = yearRows.filter(function (row) {
      return row.year <= 5 || row.year === years;
    });
    var html = '';
    shown.forEach(function (row) {
      html += '<tr><td>Year ' + row.year + '</td><td>' + fmtMoney(row.balance) + '</td><td>' +
        fmtMoney(row.contributed) + '</td><td>' + fmtMoney(row.growth) + '</td></tr>';
    });
    if (years > 6) {
      html += '<tr><td>…</td><td colspan="3">Years 6 to ' + (years - 1) + ' not shown — same monthly contributions and return assumed.</td></tr>';
    }
    tableBodyEl.innerHTML = html;

    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
