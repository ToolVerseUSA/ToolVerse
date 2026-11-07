/* Social Security Benefit Estimator — standard SSA rules only.
   Early claiming: 5/9 of 1% per month for the first 36 months early, then
   5/12 of 1% per month beyond 36 months (claiming at 62 with FRA 67 = 30%
   reduction). Delayed retirement credits: +8% per year after FRA up to
   age 70 (claiming at 70 with FRA 67 = +24%). 2027 COLA 3.6% announced
   by SSA on October 14, 2026 (2026 COLA was 2.8%). 2027 taxable maximum
   $192,300. No network calls, no storage. Estimates only. */
(function () {
  'use strict';
  var form = document.getElementById('social-security-benefit-estimator-form');
  if (!form) return; // not on this page — safe global include

  if (window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
    window.ToolVerseTools.track('social-security-benefit-estimator', 'calculators', 'tool_use');
  }

  var basisEl = document.getElementById('ss-basis');
  var piaEl = document.getElementById('ss-pia');
  var currentEl = document.getElementById('ss-current');
  var currentAgeEl = document.getElementById('ss-current-age');
  var currentFieldsEl = document.getElementById('ss-current-fields');
  var fraEl = document.getElementById('ss-fra');
  var colaEl = document.getElementById('ss-cola');
  var errorEl = document.getElementById('social-security-benefit-estimator-error');

  var ledeEl = document.getElementById('ss-lede');
  var m62El = document.getElementById('ss-62-monthly');
  var m67El = document.getElementById('ss-67-monthly');
  var m70El = document.getElementById('ss-70-monthly');
  var a62El = document.getElementById('ss-62-annual');
  var a67El = document.getElementById('ss-67-annual');
  var a70El = document.getElementById('ss-70-annual');
  var colaIncreaseEl = document.getElementById('ss-cola-increase');
  var colaAfterEl = document.getElementById('ss-cola-after');
  var piaUsedEl = document.getElementById('ss-pia-used');
  var fraUsedEl = document.getElementById('ss-fra-used');
  var noteEl = document.getElementById('ss-breakeven-note');

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

  function fraLabel(months) {
    var years = Math.floor(months / 12);
    var rem = months % 12;
    if (rem === 0) return String(years);
    return years + ' and ' + rem + ' months';
  }

  // Adjustment factor (fraction of PIA) for claiming at a given age in
  // whole years, against a full retirement age given in months.
  function factorForAge(ageYears, fraMonths) {
    var ageMonths = ageYears * 12;
    if (ageMonths < fraMonths) {
      var early = fraMonths - ageMonths;
      var reduction;
      if (early <= 36) {
        reduction = early * (5 / 9) / 100;
      } else {
        reduction = (36 * (5 / 9) + (early - 36) * (5 / 12)) / 100;
      }
      return 1 - reduction;
    }
    if (ageMonths > fraMonths) {
      var late = Math.min(ageMonths - fraMonths, 70 * 12 - fraMonths);
      return 1 + (late / 12) * 0.08;
    }
    return 1;
  }

  function setCell(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function calculate() {
    hideError();
    var fraMonths = parseInt(fraEl.value, 10);
    var cola = parseFloat(colaEl.value);
    if (isNaN(cola) || cola < 0 || cola > 10) {
      showError('Enter a COLA assumption between 0% and 10%.');
      return;
    }

    var pia;
    if (basisEl.value === 'current') {
      var current = parseFloat(currentEl.value);
      var currentAge = parseInt(currentAgeEl.value, 10);
      if (isNaN(current) || current <= 0) {
        showError('Enter your current monthly benefit (more than $0).');
        return;
      }
      if (isNaN(currentAge) || currentAge < 62 || currentAge > 70) {
        showError('Enter the age your current benefit applies to (62 to 70).');
        return;
      }
      var currentFactor = factorForAge(currentAge, fraMonths);
      pia = current / currentFactor;
    } else {
      pia = parseFloat(piaEl.value);
      if (isNaN(pia) || pia <= 0) {
        showError('Enter your monthly benefit at full retirement age (more than $0).');
        return;
      }
    }
    if (pia > 20000) {
      showError('That benefit looks too high — check the amount and try again.');
      return;
    }

    var b62 = pia * factorForAge(62, fraMonths);
    var b67 = pia * factorForAge(67, fraMonths);
    var b70 = pia * factorForAge(70, fraMonths);

    ledeEl.textContent = 'With a full retirement benefit of ' + fmt(pia) + ' per month at age ' +
      fraLabel(fraMonths) + ', claiming at 62 pays ' + fmt(b62) + ' a month, and waiting until 70 pays ' +
      fmt(b70) + ' a month.';
    m62El.textContent = fmt(b62);
    m67El.textContent = fmt(b67);
    m70El.textContent = fmt(b70);
    a62El.textContent = fmt(b62 * 12);
    a67El.textContent = fmt(b67 * 12);
    a70El.textContent = fmt(b70 * 12);

    var colaIncrease = pia * cola / 100;
    colaIncreaseEl.textContent = fmt(colaIncrease) + ' per month (' + cola + '% of ' + fmt(pia) + ')';
    colaAfterEl.textContent = fmt(pia + colaIncrease) + ' per month';
    piaUsedEl.textContent = fmt(pia) + ' per month';
    fraUsedEl.textContent = fraLabel(fraMonths);

    var ages = [62, 67, 70];
    var benefits = { 62: b62, 67: b67, 70: b70 };
    ages.forEach(function (age) {
      [80, 85].forEach(function (target) {
        setCell('ss-' + age + '-by' + target, fmt(benefits[age] * 12 * (target - age)));
      });
    });

    var total80 = { 62: b62 * 12 * 18, 67: b67 * 12 * 13, 70: b70 * 12 * 10 };
    var best80 = total80[62] >= total80[67] && total80[62] >= total80[70] ? 62 :
      (total80[67] >= total80[70] ? 67 : 70);
    var total85 = { 62: b62 * 12 * 23, 67: b67 * 12 * 18, 70: b70 * 12 * 15 };
    var best85 = total85[62] >= total85[67] && total85[62] >= total85[70] ? 62 :
      (total85[67] >= total85[70] ? 67 : 70);
    noteEl.textContent = 'On these numbers, claiming at ' + best80 + ' pays the most by age 80 and claiming at ' +
      best85 + ' pays the most by age 85. Living longer favours waiting; claiming early pays more if you do not live as long. These totals ignore future COLAs and taxes.';
  }

  basisEl.addEventListener('change', function () {
    var isCurrent = basisEl.value === 'current';
    currentFieldsEl.hidden = !isCurrent;
    piaEl.closest('label').style.display = isCurrent ? 'none' : '';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
