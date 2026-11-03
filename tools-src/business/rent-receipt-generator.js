/* Rent Receipt Generator — browser-local receipt builder. No data leaves the page. */
(function () {
  'use strict';
  var landlordEl = document.getElementById('rr-landlord');
  if (!landlordEl) return; // not on this page — safe global include

  var tenantEl = document.getElementById('rr-tenant');
  var addressEl = document.getElementById('rr-address');
  var amountEl = document.getElementById('rr-amount');
  var methodEl = document.getElementById('rr-method');
  var monthEl = document.getElementById('rr-month');
  var yearEl = document.getElementById('rr-year');
  var dateEl = document.getElementById('rr-date');
  var numberEl = document.getElementById('rr-number');
  var errorEl = document.getElementById('rr-error');
  var tracked = false;
  var numberTouched = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('rent-receipt-generator', 'business', 'tool_use');
    }
  }

  function money(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function autoNumber(dateVal) {
    // RR-YYYY-MM-001 — derived from the payment date, editable by the user.
    var parts = (dateVal || '').split('-');
    if (parts.length === 3 && parts[0].length === 4) return 'RR-' + parts[0] + '-' + parts[1] + '-001';
    var now = new Date();
    return 'RR-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-001';
  }

  function prettyDate(dateVal) {
    var parts = (dateVal || '').split('-');
    if (parts.length !== 3) return '—';
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
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

  function render() {
    var amount = parseFloat(amountEl.value);
    var amountOk = amountEl.value === '' || (!isNaN(amount) && amount >= 0);
    if (!amountOk) showError('Enter a rent amount of $0 or more.');
    else hideError();

    if (!numberTouched && numberEl) numberEl.value = autoNumber(dateEl.value);

    setText('rr-p-no', numberEl && numberEl.value ? numberEl.value : '—');
    setText('rr-p-date', prettyDate(dateEl.value));
    setText('rr-p-tenant', tenantEl.value.trim() || '—');
    setText('rr-p-landlord', landlordEl.value.trim() || '—');
    setText('rr-p-address', addressEl.value.trim() || '—');
    setText('rr-p-period', (monthEl.value || '—') + ' ' + (yearEl.value || ''));
    setText('rr-p-method', methodEl.value || '—');
    setText('rr-p-amount', !isNaN(amount) && amount >= 0 ? money(amount) : '$0.00');

    if (landlordEl.value.trim() || tenantEl.value.trim() || addressEl.value.trim() || amountEl.value) trackUse();
  }

  var fields = [landlordEl, tenantEl, addressEl, amountEl, methodEl, monthEl, yearEl, dateEl];
  fields.forEach(function (el) {
    if (el) el.addEventListener('input', render);
    if (el) el.addEventListener('change', render);
  });
  if (numberEl) numberEl.addEventListener('input', function () { numberTouched = true; render(); });
  if (dateEl) dateEl.addEventListener('change', render);

  var printBtn = document.getElementById('rr-print');
  if (printBtn) printBtn.addEventListener('click', function () { trackUse(); window.print(); });

  var clearBtn = document.getElementById('rr-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    [landlordEl, tenantEl, addressEl, amountEl].forEach(function (el) { if (el) el.value = ''; });
    if (dateEl) dateEl.value = '2026-11-03';
    if (monthEl) monthEl.value = 'November';
    if (yearEl) yearEl.value = '2026';
    if (methodEl) methodEl.value = 'Cash';
    numberTouched = false;
    hideError();
    render();
    landlordEl.focus();
  });

  render();
})();
