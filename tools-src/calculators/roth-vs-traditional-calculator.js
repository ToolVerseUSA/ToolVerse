/* Roth vs Traditional Calculator. Future value of annual contributions uses
   FV = C x (((1 + r)^n - 1) / r), with contributions at the end of each
   year. Traditional invests the full contribution pre-tax and is taxed at
   the retirement rate on withdrawal. Roth invests the contribution minus
   the current tax and is tax-free at withdrawal. 2026 limits: IRS Notice
   2025-67. The 2027 401(k) figure is a Milliman projection only, not an
   official IRS figure, and it is shown as such on the page. Estimate only,
   not financial advice. */
(function () {
  'use strict';
  var form = document.getElementById('roth-vs-traditional-calculator-form');
  if (!form) return; // not on this page, safe global include

  var errorEl = document.getElementById('roth-vs-traditional-calculator-error');
  var ledeEl = document.getElementById('roth-vs-traditional-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('roth-vs-traditional-calculator', 'calculators', 'tool_use');
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

  var contributionEl = document.getElementById('roth-vs-traditional-calculator-contribution');
  var currentRateEl = document.getElementById('roth-vs-traditional-calculator-current-rate');
  var retirementRateEl = document.getElementById('roth-vs-traditional-calculator-retirement-rate');
  var yearsEl = document.getElementById('roth-vs-traditional-calculator-years');
  var growthEl = document.getElementById('roth-vs-traditional-calculator-growth-rate');
  var tradContribEl = document.getElementById('roth-vs-traditional-calculator-trad-contrib');
  var tradPreEl = document.getElementById('roth-vs-traditional-calculator-trad-pre');
  var tradTaxEl = document.getElementById('roth-vs-traditional-calculator-trad-tax');
  var tradAfterEl = document.getElementById('roth-vs-traditional-calculator-trad-after');
  var rothContribEl = document.getElementById('roth-vs-traditional-calculator-roth-contrib');
  var rothAfterEl = document.getElementById('roth-vs-traditional-calculator-roth-after');
  var rothTaxEl = document.getElementById('roth-vs-traditional-calculator-roth-tax');
  var winnerEl = document.getElementById('roth-vs-traditional-calculator-winner');
  var differenceEl = document.getElementById('roth-vs-traditional-calculator-difference');
  var totalContribEl = document.getElementById('roth-vs-traditional-calculator-total-contrib');

  function calculate() {
    hideError();
    var contribution = parseFloat(contributionEl.value);
    var currentRate = parseFloat(currentRateEl.value);
    var retirementRate = parseFloat(retirementRateEl.value);
    var years = parseInt(yearsEl.value, 10);
    var growthRate = parseFloat(growthEl.value);
    if (isNaN(contribution) || contribution < 0) {
      showError('Enter a valid annual contribution (0 or more).');
      return;
    }
    if (isNaN(currentRate) || currentRate < 0 || currentRate > 50) {
      showError('Enter a valid current marginal tax rate between 0% and 50%.');
      return;
    }
    if (isNaN(retirementRate) || retirementRate < 0 || retirementRate > 50) {
      showError('Enter a valid retirement marginal tax rate between 0% and 50%.');
      return;
    }
    if (isNaN(years) || years < 1 || years > 50) {
      showError('Enter a whole number of years between 1 and 50.');
      return;
    }
    if (isNaN(growthRate) || growthRate < 0 || growthRate > 20) {
      showError('Enter a valid annual growth rate between 0% and 20%.');
      return;
    }
    var r = growthRate / 100;
    var factor = r === 0 ? years : (Math.pow(1 + r, years) - 1) / r;
    var tradPre = contribution * factor;
    var tradTax = tradPre * (retirementRate / 100);
    var tradAfter = tradPre - tradTax;
    var rothInvested = contribution * (1 - currentRate / 100);
    var rothAfter = rothInvested * factor;
    var rothTaxPerYear = contribution * (currentRate / 100);
    var diff = Math.abs(tradAfter - rothAfter);
    var winner = 'Tie';
    if (tradAfter > rothAfter) winner = 'Traditional wins';
    if (rothAfter > tradAfter) winner = 'Roth wins';
    ledeEl.textContent = winner + ' by ' + fmtMoney(diff) + '. Traditional leaves you with ' +
      fmtMoney(tradAfter) + ' after tax, and Roth leaves you with ' + fmtMoney(rothAfter) +
      ' tax-free.';
    tradContribEl.textContent = fmtMoney(contribution);
    tradPreEl.textContent = fmtMoney(tradPre);
    tradTaxEl.textContent = fmtMoney(tradTax);
    tradAfterEl.textContent = fmtMoney(tradAfter);
    rothContribEl.textContent = fmtMoney(rothInvested);
    rothAfterEl.textContent = fmtMoney(rothAfter);
    rothTaxEl.textContent = fmtMoney(rothTaxPerYear);
    winnerEl.textContent = winner;
    differenceEl.textContent = fmtMoney(diff);
    totalContribEl.textContent = fmtMoney(contribution * years);
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
