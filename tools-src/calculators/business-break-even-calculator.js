/* Business Break-Even Calculator. Contribution margin is price minus variable cost. Break-even units are (fixed costs + profit target) / margin. */
(function () {
  'use strict';
  var form = document.getElementById('business-break-even-calculator-form');
  if (!form) return; // not on this page, safe global include

  var errorEl = document.getElementById('business-break-even-calculator-error');
  var ledeEl = document.getElementById('business-break-even-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('business-break-even-calculator', 'calculators', 'tool_use');
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

  var fixedCostsEl = document.getElementById('business-break-even-calculator-fixed-costs');
  var priceEl = document.getElementById('business-break-even-calculator-price');
  var variableCostEl = document.getElementById('business-break-even-calculator-variable-cost');
  var profitTargetEl = document.getElementById('business-break-even-calculator-profit-target');
  var marginEl = document.getElementById('business-break-even-calculator-margin');
  var unitsEl = document.getElementById('business-break-even-calculator-units');
  var revenueEl = document.getElementById('business-break-even-calculator-revenue');
  var targetEl = document.getElementById('business-break-even-calculator-target');
  var tableEl = document.getElementById('business-break-even-calculator-table');

  function calculate() {
    hideError();
    var fixedCosts = parseFloat(fixedCostsEl.value);
    var price = parseFloat(priceEl.value);
    var variableCost = parseFloat(variableCostEl.value);
    var profitTarget = parseFloat(profitTargetEl.value);
    if (isNaN(profitTarget) || profitTarget < 0) profitTarget = 0;
    if (isNaN(fixedCosts) || fixedCosts < 0) {
      showError('Enter valid fixed costs (0 or more).');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showError('Enter a valid price per unit (more than 0).');
      return;
    }
    if (isNaN(variableCost) || variableCost < 0) {
      showError('Enter a valid variable cost per unit (0 or more).');
      return;
    }
    var margin = price - variableCost;
    if (margin <= 0) {
      showError('Your variable cost is equal to or higher than your price, so there is no break-even point. Raise the price or cut the variable cost.');
      return;
    }
    var breakEvenUnits = (fixedCosts + profitTarget) / margin;
    var breakEvenRevenue = breakEvenUnits * price;
    ledeEl.textContent = 'You need to sell ' + fmtNum(Math.ceil(breakEvenUnits)) +
      ' units per month to break even' + (profitTarget > 0 ? ' and hit your profit target' : '') +
      ', which is ' + fmtMoney(breakEvenRevenue) + ' in revenue.';
    marginEl.textContent = fmtMoney(margin) + ' per unit';
    unitsEl.textContent = fmtNum(Math.ceil(breakEvenUnits)) + ' units';
    revenueEl.textContent = fmtMoney(breakEvenRevenue);
    targetEl.textContent = fmtMoney(profitTarget) + ' per month';
    var levels = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5];
    var rows = '';
    levels.forEach(function (level) {
      var units = Math.round(breakEvenUnits * level);
      var revenue = units * price;
      var profit = units * margin - fixedCosts;
      rows += '<tr><td>' + (level * 100) + '% of break-even</td><td>' + fmtNum(units) +
        '</td><td>' + fmtMoney(revenue) + '</td><td>' + fmtMoney(profit) + '</td></tr>';
    });
    tableEl.innerHTML = rows;
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
