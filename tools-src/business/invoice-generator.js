/* Invoice Generator — browser-local invoice math. No data leaves the page. */
(function () {
  'use strict';
  var sellerEl = document.getElementById('inv-seller-name');
  if (!sellerEl) return; // not on this page — safe global include
  var itemsEl = document.getElementById('inv-items');
  var preview = document.getElementById('inv-preview');
  var errorEl = document.getElementById('inv-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('invoice-generator', 'business', 'tool_use');
    }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function money(n) {
    return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function addRow(desc, qty, rate) {
    var row = document.createElement('div');
    row.className = 'inv-row';
    row.innerHTML =
      '<div class="inv-desc-cell"><label>Description</label><input class="tv-field inv-desc" type="text" placeholder="Website design" style="width:100%"></div>' +
      '<div><label>Qty</label><input class="tv-field inv-qty" type="number" min="0" step="1" style="width:100%"></div>' +
      '<div><label>Rate ($)</label><input class="tv-field inv-rate" type="number" min="0" step="0.01" style="width:100%"></div>' +
      '<div class="inv-amount" style="font-weight:700;white-space:nowrap">$0.00</div>' +
      '<div><button class="button inv-remove" type="button" aria-label="Remove line">Remove</button></div>';
    row.querySelector('.inv-desc').value = desc || '';
    row.querySelector('.inv-qty').value = qty == null ? '' : qty;
    row.querySelector('.inv-rate').value = rate == null ? '' : rate;
    row.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', render); });
    row.querySelector('.inv-remove').addEventListener('click', function () {
      if (itemsEl.querySelectorAll('.inv-row').length <= 1) { showError('An invoice needs at least one line item.'); return; }
      hideError();
      row.remove();
      render();
    });
    itemsEl.appendChild(row);
    return row;
  }

  function render() {
    var rows = itemsEl.querySelectorAll('.inv-row');
    var subtotal = 0;
    var lines = '';
    rows.forEach(function (row) {
      var desc = row.querySelector('.inv-desc').value.trim() || 'Item';
      var qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.inv-rate').value) || 0;
      var amount = qty * rate;
      subtotal += amount;
      row.querySelector('.inv-amount').textContent = money(amount);
      lines += '<tr><td>' + esc(desc) + '</td><td>' + qty + '</td><td>' + money(rate) + '</td><td>' + money(amount) + '</td></tr>';
    });
    var taxPct = parseFloat(val('inv-tax')) || 0;
    var tax = subtotal * taxPct / 100;
    var total = subtotal + tax;
    var html = '<div class="inv-head"><div><h3>INVOICE</h3><p style="margin:4px 0 0;font-size:14px">' +
      esc(val('inv-seller-name') || 'Your Business') + '</p></div>' +
      '<div style="text-align:right;font-size:14px"><div>Invoice # ' + esc(val('inv-number') || 'INV-001') + '</div>' +
      (val('inv-date') ? '<div>Date: ' + esc(val('inv-date')) + '</div>' : '') +
      (val('inv-due') ? '<div>Due: ' + esc(val('inv-due')) + '</div>' : '') + '</div></div>';
    html += '<div class="inv-parties"><div><b>From</b><br>' + esc(val('inv-seller-name') || 'Your Business') +
      (val('inv-seller-addr') ? '<br>' + esc(val('inv-seller-addr')).replace(/\n/g, '<br>') : '') + '</div>' +
      '<div><b>Bill to</b><br>' + esc(val('inv-buyer-name') || 'Client') +
      (val('inv-buyer-addr') ? '<br>' + esc(val('inv-buyer-addr')).replace(/\n/g, '<br>') : '') + '</div></div>';
    html += '<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + lines + '</tbody></table>';
    html += '<div class="inv-totals"><div><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
      '<div><span>Tax (' + taxPct + '%)</span><span>' + money(tax) + '</span></div>' +
      '<div class="inv-total"><span>TOTAL</span><span id="inv-total-value">' + money(total) + '</span></div></div>';
    if (val('inv-notes')) html += '<p class="inv-notes">' + esc(val('inv-notes')) + '</p>';
    if (val('inv-pay')) html += '<p class="inv-notes"><b>Payment instructions</b><br>' + esc(val('inv-pay')) + '</p>';
    preview.innerHTML = html;
    if (val('inv-seller-name') || val('inv-buyer-name') || subtotal > 0) trackUse();
  }

  addRow('Website design', 1, 500);
  addRow('', '', '');
  ['inv-seller-name', 'inv-seller-addr', 'inv-buyer-name', 'inv-buyer-addr',
   'inv-number', 'inv-date', 'inv-due', 'inv-tax', 'inv-notes', 'inv-pay'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });
  document.getElementById('inv-add-row').addEventListener('click', function () {
    hideError();
    addRow('', '', '');
    render();
  });
  document.getElementById('inv-clear').addEventListener('click', function () {
    itemsEl.innerHTML = '';
    addRow('', '', '');
    ['inv-seller-name', 'inv-seller-addr', 'inv-buyer-name', 'inv-buyer-addr',
     'inv-number', 'inv-date', 'inv-due', 'inv-tax', 'inv-notes', 'inv-pay'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = id === 'inv-number' ? 'INV-001' : id === 'inv-tax' ? '0' : '';
    });
    hideError();
    render();
    sellerEl.focus();
  });
  document.getElementById('inv-print').addEventListener('click', function () {
    if (!val('inv-buyer-name')) { showError('Add the client name before printing.'); return; }
    hideError();
    trackUse();
    window.print();
  });
  render();
})();
