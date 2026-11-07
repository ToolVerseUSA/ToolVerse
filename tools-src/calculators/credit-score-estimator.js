/* Credit Score Estimator — EDUCATIONAL ONLY. This tool has no connection
   to Equifax, Experian or TransUnion and cannot see a real credit score.
   It maps five answers to a 300-850 range using a simple model that
   approximates FICO weights, and always shows a range, never one exact
   number. Nothing is uploaded or stored. */
(function () {
  'use strict';
  var form = document.getElementById('cse-form');
  if (!form) return; // not on this page — safe global include

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('credit-score-estimator', 'calculators', 'tool_use');
    }
  }

  var errorEl = document.getElementById('cse-error');

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

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Educational model approximating FICO weights. Each answer is a
  // 0-1 fraction; the weighted sum maps to the 300-850 scale.
  var FACTORS = [
    { id: 'cse-payment', weight: 0.35, name: 'Payment history', resultId: 'cse-f-payment' },
    { id: 'cse-utilization', weight: 0.30, name: 'Amounts owed / utilization', resultId: 'cse-f-utilization' },
    { id: 'cse-oldest', weight: 0.15, name: 'Length of history', resultId: 'cse-f-oldest' },
    { id: 'cse-inquiries', weight: 0.10, name: 'New credit', resultId: 'cse-f-inquiries' },
    { id: 'cse-mix', weight: 0.10, name: 'Credit mix', resultId: 'cse-f-mix' }
  ];

  var TIPS = {
    'cse-payment': 'Pay every bill on time — set up autopay for at least the minimum payment.',
    'cse-utilization': 'Pay card balances down below 30% of your limits, and under 10% if you can.',
    'cse-oldest': 'Keep your oldest card open, even if you rarely use it — closing it shortens your history.',
    'cse-inquiries': 'Apply for new credit only when you need it — each hard inquiry can lower your score for a while.',
    'cse-mix': 'Do not open accounts just for variety — on-time payments and low balances matter far more.'
  };

  function describe(value) {
    if (value >= 0.95) return 'Excellent';
    if (value >= 0.75) return 'Good';
    if (value >= 0.5) return 'Fair';
    if (value >= 0.3) return 'Weak';
    return 'Poor';
  }

  function category(score) {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  }

  function round5(value) {
    return Math.round(value / 5) * 5;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var values = [];
    for (var i = 0; i < FACTORS.length; i++) {
      var el = document.getElementById(FACTORS[i].id);
      if (!el) {
        showError('Something went wrong loading the form. Please reload the page and try again.');
        return;
      }
      var v = parseFloat(el.value);
      if (isNaN(v) || v < 0 || v > 1) {
        showError('Please answer every question before estimating.');
        return;
      }
      values.push(v);
    }

    var weighted = 0;
    var strongest = 0;
    var weakest = 0;
    for (var j = 0; j < FACTORS.length; j++) {
      weighted += FACTORS[j].weight * values[j];
      if (values[j] > values[strongest]) strongest = j;
      if (values[j] < values[weakest]) weakest = j;
      setText(FACTORS[j].resultId, describe(values[j]) + ' (' + Math.round(values[j] * 100) + '%)');
    }

    var midpoint = 300 + 550 * weighted;
    var low = round5(Math.max(300, midpoint - 20));
    var high = round5(Math.min(850, midpoint + 20));

    setText('cse-lede', 'Estimate only — this is not your real credit score. Check your real score free at AnnualCreditReport.com.');
    setText('cse-range', 'About ' + low + '-' + high);
    setText('cse-label', category(midpoint));
    setText('cse-strongest', FACTORS[strongest].name + ' — ' + describe(values[strongest]));
    setText('cse-weakest', FACTORS[weakest].name + ' — ' + describe(values[weakest]));

    // One improvement tip per factor, weakest first.
    var tipsEl = document.getElementById('cse-tips');
    if (tipsEl) {
      var order = FACTORS.slice().sort(function (a, b) {
        return values[FACTORS.indexOf(a)] - values[FACTORS.indexOf(b)];
      });
      var html = '';
      for (var k = 0; k < order.length; k++) {
        html += '<li><strong>' + order[k].name + ':</strong> ' + TIPS[order[k].id] + '</li>';
      }
      tipsEl.innerHTML = html;
    }

    trackUse();
  });
})();
