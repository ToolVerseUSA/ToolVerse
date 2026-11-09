/* AI Workflow ROI Calculator. All results are estimates based on the entered assumptions. */
(function () {
  'use strict';
  var form = document.getElementById('ai-workflow-roi-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('ai-workflow-roi-calculator-error');
  var ledeEl = document.getElementById('ai-workflow-roi-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('ai-workflow-roi-calculator', 'calculators', 'tool_use');
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

  var hoursEl = document.getElementById('ai-workflow-roi-calculator-hours');
  var valueEl = document.getElementById('ai-workflow-roi-calculator-value');
  var weeksEl = document.getElementById('ai-workflow-roi-calculator-weeks');
  var softwareEl = document.getElementById('ai-workflow-roi-calculator-software');
  var setupEl = document.getElementById('ai-workflow-roi-calculator-setup');
  var reviewEl = document.getElementById('ai-workflow-roi-calculator-review');
  var grossEl = document.getElementById('ai-workflow-roi-calculator-gross');
  var softwareOutEl = document.getElementById('ai-workflow-roi-calculator-software-year');
  var setupCostEl = document.getElementById('ai-workflow-roi-calculator-setupcost');
  var reviewCostEl = document.getElementById('ai-workflow-roi-calculator-reviewcost');
  var costsEl = document.getElementById('ai-workflow-roi-calculator-costs');
  var netEl = document.getElementById('ai-workflow-roi-calculator-net');
  var paybackEl = document.getElementById('ai-workflow-roi-calculator-payback');
  var roiEl = document.getElementById('ai-workflow-roi-calculator-roi');

  function calculate() {
    hideError();
    var hours = parseFloat(hoursEl.value);
    var value = parseFloat(valueEl.value);
    var weeks = parseInt(weeksEl.value, 10);
    var software = parseFloat(softwareEl.value);
    var setup = parseFloat(setupEl.value);
    var review = parseFloat(reviewEl.value);
    if (isNaN(hours) || hours < 0 || hours > 80) {
      showError('Enter hours saved per week between 0 and 80.');
      return;
    }
    if (isNaN(value) || value < 0) {
      showError('Enter a valid value of an hour (0 or more).');
      return;
    }
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      showError('Enter weeks per year between 1 and 52.');
      return;
    }
    if (isNaN(software) || software < 0) {
      showError('Enter a valid software cost per month (0 or more).');
      return;
    }
    if (isNaN(setup) || setup < 0) {
      showError('Enter valid one-time setup hours (0 or more).');
      return;
    }
    if (isNaN(review) || review < 0 || review > 80) {
      showError('Enter human review hours per week between 0 and 80.');
      return;
    }
    var gross = hours * value * weeks;
    var softwareYear = software * 12;
    var setupCost = setup * value;
    var reviewCost = review * value * weeks;
    var costs = softwareYear + setupCost + reviewCost;
    var net = gross - costs;
    grossEl.textContent = fmtMoney(gross) + ' (estimate)';
    softwareOutEl.textContent = fmtMoney(softwareYear) + ' (estimate)';
    setupCostEl.textContent = fmtMoney(setupCost) + ' (estimate)';
    reviewCostEl.textContent = fmtMoney(reviewCost) + ' (estimate)';
    costsEl.textContent = fmtMoney(costs) + ' (estimate)';
    netEl.textContent = fmtMoney(net) + ' (estimate)';
    var weeklyNet = hours * value - software * 12 / 52 - review * value;
    if (setupCost === 0) {
      paybackEl.textContent = 'No setup cost, so no payback wait';
    } else if (weeklyNet <= 0) {
      paybackEl.textContent = 'No payback at these rates (weekly costs eat the savings)';
    } else {
      var weeksPayback = setupCost / weeklyNet;
      paybackEl.textContent = weeksPayback.toFixed(1) + ' weeks (estimate)';
    }
    if (costs === 0) {
      roiEl.textContent = 'No costs entered, ROI not defined';
    } else {
      roiEl.textContent = (net / costs * 100).toFixed(0) + '% (estimate)';
    }
    ledeEl.textContent = 'Estimate: the workflow saves about ' + fmtMoney(gross) +
      ' of time value a year against ' + fmtMoney(costs) + ' of yearly costs, for a net yearly value of ' + fmtMoney(net) + '.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
