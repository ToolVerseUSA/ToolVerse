/* Unit Converter — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var form = document.getElementById('uc-form');
  if (!form) return; // not on this page — safe global include

  var CATEGORIES = {
    length: {
      label: 'Length',
      base: 'm',
      units: [
        ['mm', 'Millimeters (mm)', 0.001],
        ['cm', 'Centimeters (cm)', 0.01],
        ['m', 'Meters (m)', 1],
        ['km', 'Kilometers (km)', 1000],
        ['in', 'Inches (in)', 0.0254],
        ['ft', 'Feet (ft)', 0.3048],
        ['yd', 'Yards (yd)', 0.9144],
        ['mi', 'Miles (mi)', 1609.344]
      ]
    },
    weight: {
      label: 'Weight',
      base: 'g',
      units: [
        ['g', 'Grams (g)', 1],
        ['kg', 'Kilograms (kg)', 1000],
        ['oz', 'Ounces (oz)', 28.349523125],
        ['lb', 'Pounds (lb)', 453.59237],
        ['t', 'Metric tons (t)', 1000000]
      ]
    },
    temperature: {
      label: 'Temperature',
      special: true,
      units: [
        ['c', 'Celsius (°C)'],
        ['f', 'Fahrenheit (°F)'],
        ['k', 'Kelvin (K)']
      ]
    }
  };

  var categoryEl = document.getElementById('uc-category');
  var amountEl = document.getElementById('uc-amount');
  var fromEl = document.getElementById('uc-from');
  var toEl = document.getElementById('uc-to');
  var errorEl = document.getElementById('uc-error');
  var resultEl = document.getElementById('uc-result');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('unit-converter', 'calculators', 'tool_use');
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function fillUnits() {
    var cat = CATEGORIES[categoryEl.value];
    fromEl.innerHTML = '';
    toEl.innerHTML = '';
    cat.units.forEach(function (u, i) {
      var o1 = document.createElement('option');
      o1.value = u[0];
      o1.textContent = u[1];
      fromEl.appendChild(o1);
      var o2 = document.createElement('option');
      o2.value = u[0];
      o2.textContent = u[1];
      toEl.appendChild(o2);
      if (i === 0) o1.selected = true;
      if (i === 1) o2.selected = true;
    });
  }

  function factorOf(cat, code) {
    for (var i = 0; i < cat.units.length; i++) {
      if (cat.units[i][0] === code) return cat.units[i][2];
    }
    return null;
  }

  function convertTemperature(value, from, to) {
    var c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else c = value - 273.15;
    if (to === 'c') return { value: c, formula: 'direct' };
    if (to === 'f') return { value: c * 9 / 5 + 32, formula: '(°C × 9/5) + 32' };
    return { value: c + 273.15, formula: '°C + 273.15' };
  }

  function fmt(n) {
    if (!isFinite(n)) return '—';
    var abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(6);
    return parseFloat(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  function unitLabel(code) {
    var cat = CATEGORIES[categoryEl.value];
    for (var i = 0; i < cat.units.length; i++) {
      if (cat.units[i][0] === code) return cat.units[i][1];
    }
    return code;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();
    var amount = parseFloat(amountEl.value);
    if (!isFinite(amount)) {
      showError('Enter a valid number for the amount.');
      return;
    }
    var cat = CATEGORIES[categoryEl.value];
    var from = fromEl.value;
    var to = toEl.value;
    var result, formula;
    if (cat.special) {
      var t = convertTemperature(amount, from, to);
      result = t.value;
      formula = t.formula;
    } else {
      var fFrom = factorOf(cat, from);
      var fTo = factorOf(cat, to);
      result = amount * fFrom / fTo;
      formula = 'amount × ' + fFrom + ' ÷ ' + fTo + ' (via ' + cat.base + ')';
    }
    document.getElementById('uc-input-echo').textContent = fmt(amount) + ' ' + unitLabel(from);
    document.getElementById('uc-output').textContent = fmt(result) + ' ' + unitLabel(to);
    document.getElementById('uc-formula').textContent = formula;
    document.getElementById('uc-lede').textContent =
      fmt(amount) + ' ' + unitLabel(from) + ' = ' + fmt(result) + ' ' + unitLabel(to);
    resultEl.hidden = false;
    resultEl.focus();
    trackUse();
  });

  categoryEl.addEventListener('change', fillUnits);
  fillUnits();
})();
