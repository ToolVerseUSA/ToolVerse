/* Medicare Cost Estimator — 2026 figures confirmed by CMS (released
   November 14, 2025): Part B standard premium $202.90/month, annual
   deductible $283. Part A premium 2026: $0 with 40+ quarters, $311 with
   30-39 quarters, $565 with fewer than 30 quarters. Part B IRMAA 2026
   tiers (CMS fact sheet, based on 2024 MAGI): $0 / $81.20 / $202.90 /
   $324.60 / $446.30 / $487.00. 2027 Part B premium $209.50 is a projection
   from the 2026 Trustees Report only — NOT confirmed; 2027 IRMAA tiers
   are not announced, so 2026 tiers are shown as a guide for 2027. No
   Part D IRMAA is added (unverified here). No network calls, no storage. */
(function () {
  'use strict';
  var form = document.getElementById('medicare-cost-estimator-form');
  if (!form) return; // not on this page — safe global include

  if (window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
    window.ToolVerseTools.track('medicare-cost-estimator', 'calculators', 'tool_use');
  }

  var statusEl = document.getElementById('mc-status');
  var magiEl = document.getElementById('mc-magi');
  var quartersEl = document.getElementById('mc-quarters');
  var partDEl = document.getElementById('mc-partd');
  var medigapEl = document.getElementById('mc-medigap');
  var yearEl = document.getElementById('mc-year');
  var errorEl = document.getElementById('medicare-cost-estimator-error');

  var ledeEl = document.getElementById('mc-lede');
  var partAEl = document.getElementById('mc-parta');
  var partBBaseEl = document.getElementById('mc-partb-base');
  var irmaaEl = document.getElementById('mc-irmaa');
  var partBTotalEl = document.getElementById('mc-partb-total');
  var partDOutEl = document.getElementById('mc-partd-out');
  var medigapOutEl = document.getElementById('mc-medigap-out');
  var totalMonthlyEl = document.getElementById('mc-total-monthly');
  var totalAnnualEl = document.getElementById('mc-total-annual');
  var deductibleEl = document.getElementById('mc-deductible');
  var tierEl = document.getElementById('mc-tier');
  var yearNoteEl = document.getElementById('mc-year-note');

  // 2026 Part B IRMAA tiers from the CMS fact sheet (2024 MAGI).
  var TIERS = [
    { indMax: 109000, jointMax: 218000, surcharge: 0, label: 'No IRMAA — standard premium only' },
    { indMax: 137000, jointMax: 274000, surcharge: 81.20, label: 'Tier 1' },
    { indMax: 171000, jointMax: 342000, surcharge: 202.90, label: 'Tier 2' },
    { indMax: 205000, jointMax: 410000, surcharge: 324.60, label: 'Tier 3' },
    { indMax: 499999, jointMax: 749999, surcharge: 446.30, label: 'Tier 4' },
    { indMax: Infinity, jointMax: Infinity, surcharge: 487.00, label: 'Tier 5 (highest)' }
  ];

  var PART_A = { '40plus': 0, '30to39': 311, 'under30': 565 };
  var PART_B_BASE = { '2026': 202.90, '2027': 209.50 };
  var PART_B_DEDUCTIBLE = { '2026': 283 };

  function fmt(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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

  function findTier(magi, status) {
    for (var i = 0; i < TIERS.length; i++) {
      var max = status === 'joint' ? TIERS[i].jointMax : TIERS[i].indMax;
      if (magi <= max) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  function calculate() {
    hideError();
    var magi = parseFloat(magiEl.value);
    var partD = parseFloat(partDEl.value);
    var medigap = parseFloat(medigapEl.value);
    if (isNaN(magi) || magi < 0) {
      showError('Enter your MAGI (0 or more).');
      return;
    }
    if (isNaN(partD) || partD < 0) {
      showError('Enter your Part D plan premium (0 or more — enter 0 if you have no Part D plan).');
      return;
    }
    if (isNaN(medigap) || medigap < 0) {
      showError('Enter your Medigap premium (0 or more — enter 0 if you have none).');
      return;
    }

    var year = yearEl.value;
    var partA = PART_A[quartersEl.value];
    var partBBase = PART_B_BASE[year];
    var tier = findTier(magi, statusEl.value);
    var irmaa = tier.surcharge;
    var partBTotal = partBBase + irmaa;
    var totalMonthly = partA + partBTotal + partD + medigap;

    ledeEl.textContent = 'For ' + year + ', your estimated Medicare cost is ' + fmt(totalMonthly) +
      ' per month (' + fmt(totalMonthly * 12) + ' per year) in premiums.';
    partAEl.textContent = fmt(partA) + ' per month';
    partBBaseEl.textContent = fmt(partBBase) + ' per month' + (year === '2027' ? ' (projected)' : ' (confirmed by CMS)');
    irmaaEl.textContent = irmaa === 0 ? '$0.00 — no surcharge at this income' : fmt(irmaa) + ' per month';
    partBTotalEl.textContent = fmt(partBTotal) + ' per month';
    partDOutEl.textContent = fmt(partD) + ' per month';
    medigapOutEl.textContent = fmt(medigap) + ' per month';
    totalMonthlyEl.textContent = fmt(totalMonthly) + ' per month';
    totalAnnualEl.textContent = fmt(totalMonthly * 12) + ' per year';
    deductibleEl.textContent = PART_B_DEDUCTIBLE[year] !== undefined
      ? fmt(PART_B_DEDUCTIBLE[year]) + ' per year (2026, confirmed by CMS)'
      : 'Not announced yet for 2027';
    tierEl.textContent = tier.label + ' — based on ' + fmt(magi) + ' MAGI (' +
      (statusEl.value === 'joint' ? 'joint' : 'individual') + ')';
    yearNoteEl.textContent = year === '2027'
      ? '2027 figures are projections only: the $209.50 Part B premium comes from the 2026 Trustees Report and is not confirmed, and the 2027 IRMAA tiers are not announced yet — the 2026 tiers above are shown as a guide. The 2027 Part B deductible is also not announced yet.'
      : '2026 figures are confirmed by CMS (released November 14, 2025). IRMAA is based on your 2024 MAGI — income from two years earlier.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
