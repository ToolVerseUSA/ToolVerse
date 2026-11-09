/* US Income Percentile Calculator. Data: U.S. Census Bureau, CPS ASEC, Table PINC-11, income year 2024 (survey 2025). Combined males plus females, all races, people 15 and over. See research/census-pinc11-2024.json for the verified table. */
(function () {
  'use strict';
  var form = document.getElementById('income-percentile-calculator-form');
  if (!form) return; // not on this page, safe global include

  var bands = [
    { label: "Under $2,500", people: 44290000 },
    { label: "$2,500 to $4,999", people: 4856000 },
    { label: "$5,000 to $7,499", people: 5023000 },
    { label: "$7,500 to $9,999", people: 4389000 },
    { label: "$10,000 to $12,499", people: 8339000 },
    { label: "$12,500 to $14,999", people: 7110000 },
    { label: "$15,000 to $17,499", people: 8138000 },
    { label: "$17,500 to $19,999", people: 6033000 },
    { label: "$20,000 to $22,499", people: 9050000 },
    { label: "$22,500 to $24,999", people: 6050000 },
    { label: "$25,000 to $27,499", people: 8299000 },
    { label: "$27,500 to $29,999", people: 4940000 },
    { label: "$30,000 to $32,499", people: 9665000 },
    { label: "$32,500 to $34,999", people: 4349000 },
    { label: "$35,000 to $37,499", people: 7893000 },
    { label: "$37,500 to $39,999", people: 4508000 },
    { label: "$40,000 to $42,499", people: 8249000 },
    { label: "$42,500 to $44,999", people: 3518000 },
    { label: "$45,000 to $47,499", people: 6385000 },
    { label: "$47,500 to $49,999", people: 4018000 },
    { label: "$50,000 to $52,499", people: 8610000 },
    { label: "$52,500 to $54,999", people: 3353000 },
    { label: "$55,000 to $57,499", people: 4918000 },
    { label: "$57,500 to $59,999", people: 2580000 },
    { label: "$60,000 to $62,499", people: 7485000 },
    { label: "$62,500 to $64,999", people: 2451000 },
    { label: "$65,000 to $67,499", people: 4072000 },
    { label: "$67,500 to $69,999", people: 2256000 },
    { label: "$70,000 to $72,499", people: 4894000 },
    { label: "$72,500 to $74,999", people: 2217000 },
    { label: "$75,000 to $77,499", people: 4358000 },
    { label: "$77,500 to $79,999", people: 1893000 },
    { label: "$80,000 to $82,499", people: 4172000 },
    { label: "$82,500 to $84,999", people: 1807000 },
    { label: "$85,000 to $87,499", people: 2681000 },
    { label: "$87,500 to $89,999", people: 1415000 },
    { label: "$90,000 to $92,499", people: 2907000 },
    { label: "$92,500 to $94,999", people: 1336000 },
    { label: "$95,000 to $97,499", people: 2092000 },
    { label: "$97,500 to $99,999", people: 1283000 },
    { label: "$100,000 to $149,999", people: 23909000 },
    { label: "$150,000 to $199,999", people: 10713000 },
    { label: "$200,000 to $249,999", people: 4777000 },
    { label: "$250,000 and over", people: 7021000 }
  ];
  var totalPeople = 0;
  for (var i = 0; i < bands.length; i++) { totalPeople += bands[i].people; }
  var lowers = [0, 2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000, 27500, 30000, 32500, 35000, 37500, 40000, 42500, 45000, 47500, 50000, 52500, 55000, 57500, 60000, 62500, 65000, 67500, 70000, 72500, 75000, 77500, 80000, 82500, 85000, 87500, 90000, 92500, 95000, 97500, 100000, 150000, 200000, 250000];
  var uppers = [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000, 27500, 30000, 32500, 35000, 37500, 40000, 42500, 45000, 47500, 50000, 52500, 55000, 57500, 60000, 62500, 65000, 67500, 70000, 72500, 75000, 77500, 80000, 82500, 85000, 87500, 90000, 92500, 95000, 97500, 100000, 150000, 200000, 250000, null];


  var errorEl = document.getElementById('income-percentile-calculator-error');
  var ledeEl = document.getElementById('income-percentile-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('income-percentile-calculator', 'calculators', 'tool_use');
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

  var incomeEl = document.getElementById('income-percentile-calculator-income');
  var householdEl = document.getElementById('income-percentile-calculator-household');
  var bandEl = document.getElementById('income-percentile-calculator-band');
  var bandPeopleEl = document.getElementById('income-percentile-calculator-bandpeople');
  var bandShareEl = document.getElementById('income-percentile-calculator-bandshare');
  var lessEl = document.getElementById('income-percentile-calculator-less');
  var medianEl = document.getElementById('income-percentile-calculator-median');
  var contextEl = document.getElementById('income-percentile-calculator-context');

  function calculate() {
    hideError();
    var income = parseFloat(incomeEl.value);
    var household = parseInt(householdEl.value, 10);
    if (isNaN(income) || income < 0 || income > 100000000) {
      showError('Enter a valid annual income (0 or more).');
      return;
    }
    if (householdEl.value !== '' && (isNaN(household) || household < 1 || household > 20)) {
      showError('Household size, if entered, must be a whole number between 1 and 20.');
      return;
    }
    var idx = bands.length - 1;
    for (var i = 0; i < bands.length; i++) {
      if (uppers[i] !== null && income < uppers[i]) { idx = i; break; }
    }
    var below = 0;
    for (var j = 0; j < idx; j++) { below += bands[j].people; }
    var bandShare = bands[idx].people / totalPeople * 100;
    var pctLess;
    if (uppers[idx] === null) {
      pctLess = below / totalPeople * 100;
      lessEl.textContent = 'More than ' + pctLess.toFixed(1) + '% (top band, open ended)';
    } else {
      var frac = (income - lowers[idx]) / (uppers[idx] - lowers[idx]);
      if (frac < 0) { frac = 0; }
      if (frac > 1) { frac = 1; }
      pctLess = (below + frac * bands[idx].people) / totalPeople * 100;
      lessEl.textContent = 'About ' + pctLess.toFixed(1) + '% (estimate, interpolated inside the band)';
    }
    bandEl.textContent = bands[idx].label;
    bandPeopleEl.textContent = fmtNum(bands[idx].people) + ' people';
    bandShareEl.textContent = bandShare.toFixed(2) + '% of US people age 15 and over';
    medianEl.textContent = '$37,500 to $39,999';
    var note = 'This is individual income before tax, for one person, not household income. ';
    if (!isNaN(household) && household > 1) {
      note += 'You entered a household of ' + household + ' people, but the comparison still uses your individual income only. ';
    }
    note += 'The median individual income falls in the $37,500 to $39,999 band, so an income of ' +
      fmtMoney(income) + ' sits ' + (pctLess >= 50 ? 'above' : 'below') + ' the middle of the distribution.';
    contextEl.textContent = note;
    ledeEl.textContent = 'An income of ' + fmtMoney(income) + ' falls in the ' + bands[idx].label +
      ' band. About ' + pctLess.toFixed(1) + '% of US people age 15 and over earn less.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
