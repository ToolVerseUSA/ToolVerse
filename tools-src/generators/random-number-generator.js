/* Random Number Generator — crypto RNG with rejection sampling (no modulo bias). No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('rn-output');
  if (!output) return;

  var minEl = document.getElementById('rn-min');
  var maxEl = document.getElementById('rn-max');
  var qtyEl = document.getElementById('rn-qty');
  var decEl = document.getElementById('rn-dec');
  var uniqueEl = document.getElementById('rn-unique');
  var errorEl = document.getElementById('rn-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-number-generator', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  // Unbiased draw in [0, span) for arbitrary span via masked rejection sampling on bytes.
  function randBelowBig(span) {
    var bits = span.toString(2).length;
    var bytes = Math.ceil(bits / 8);
    var mask = (1n << BigInt(bits)) - 1n;
    var buf = new Uint8Array(bytes);
    while (true) {
      crypto.getRandomValues(buf);
      var v = 0n;
      for (var i = 0; i < bytes; i++) v = (v << 8n) | BigInt(buf[i]);
      v &= mask;
      if (v < span) return v;
    }
  }

  function generate() {
    var dec = parseInt(decEl.value, 10);
    var scale = Math.pow(10, dec);
    var min = Math.round(parseFloat(minEl.value) * scale);
    var max = Math.round(parseFloat(maxEl.value) * scale);
    var qty = parseInt(qtyEl.value, 10);
    if (isNaN(min) || isNaN(max)) { showError('Enter a valid minimum and maximum.'); return; }
    if (min > max) { showError('Minimum must not be greater than maximum.'); return; }
    if (isNaN(qty) || qty < 1) { showError('Quantity must be at least 1.'); return; }
    if (qty > 100) { qty = 100; qtyEl.value = '100'; }
    var minB = BigInt(min), maxB = BigInt(max);
    var span = maxB - minB + 1n;
    if (span > 1000000000000000n) { showError('That range is too wide — keep max − min under 1,000,000,000,000,000.'); return; }
    hideError();
    var results = [];
    if (uniqueEl.checked) {
      if (BigInt(qty) > span) {
        showError('You asked for ' + qty + ' unique values but that range only contains ' + span.toString() + ' possibilities.');
        return;
      }
      var seen = new Set();
      var guard = 0;
      while (results.length < qty && guard < qty * 200) {
        guard++;
        var v1 = minB + randBelowBig(span);
        var k1 = v1.toString();
        if (!seen.has(k1)) { seen.add(k1); results.push(v1); }
      }
      if (results.length < qty) { showError('Could not draw enough unique values — try a wider range.'); return; }
    } else {
      for (var i = 0; i < qty; i++) results.push(minB + randBelowBig(span));
    }
    output.value = results.map(function (v) {
      if (dec === 0) return v.toString();
      var neg = v < 0n;
      var abs = (neg ? -v : v).toString().padStart(dec + 1, '0');
      var intPart = abs.slice(0, abs.length - dec);
      var fracPart = abs.slice(abs.length - dec);
      return (neg ? '-' : '') + intPart + '.' + fracPart;
    }).join(', ');
    trackUse();
  }

  document.getElementById('rn-gen').addEventListener('click', generate);
  document.getElementById('rn-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some numbers first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  generate();
})();
