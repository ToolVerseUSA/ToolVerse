/* Contract Templates — browser-local contract drafts. No data leaves the page. */
(function () {
  'use strict';
  var templateEl = document.getElementById('ct-template');
  if (!templateEl) return; // not on this page — safe global include
  var preview = document.getElementById('ct-preview');
  var errorEl = document.getElementById('ct-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('contract-templates', 'business', 'tool_use');
    }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  var TITLES = {
    freelance: 'Freelance Service Agreement',
    nda: 'Non-Disclosure Agreement (NDA)',
    service: 'Service Agreement'
  };

  function render() {
    var kind = templateEl.value;
    var a = val('ct-party-a') || '[Party A]';
    var b = val('ct-party-b') || '[Party B]';
    var scope = val('ct-scope') || '[describe the services or subject matter here]';
    var amount = val('ct-amount') || '[payment amount]';
    var terms = val('ct-terms') || '[payment terms]';
    var start = val('ct-start') || '[start date]';
    var end = val('ct-end') || '[end date / duration]';
    var state = val('ct-state') || '[state]';
    var html = '<p class="ct-note"><strong>Template — not legal advice.</strong> This is a general-purpose draft in plain English. It is not legal advice and may not fit your situation or your state\u2019s rules. Have a licensed attorney review it before you sign.</p>';
    html += '<h3>' + esc(TITLES[kind] || 'Contract') + '</h3>';
    html += '<p>This agreement is between <b>' + esc(a) + '</b> (\u201cParty A\u201d) and <b>' + esc(b) + '</b> (\u201cParty B\u201d), effective <b>' + esc(start) + '</b>.</p>';
    if (kind === 'freelance') {
      html += '<h4>1. Services</h4><p>Party A agrees to provide the following services to Party B: ' + esc(scope) + '.</p>';
      html += '<h4>2. Payment</h4><p>Party B agrees to pay Party A ' + esc(amount) + '. Payment terms: ' + esc(terms) + '.</p>';
      html += '<h4>3. Term</h4><p>This agreement starts on ' + esc(start) + ' and ends on ' + esc(end) + ', unless ended earlier under section 5.</p>';
      html += '<h4>4. Independent contractor</h4><p>Party A is an independent contractor, not an employee of Party B. Party A is responsible for their own taxes, tools and expenses unless the parties agree otherwise in writing.</p>';
      html += '<h4>5. Ending the agreement</h4><p>Either party may end this agreement with 14 days\u2019 written notice. Party B will pay for work completed up to the end date.</p>';
      html += '<h4>6. Ownership</h4><p>Work delivered and paid for under this agreement belongs to Party B once payment is received in full, unless the parties agree otherwise in writing.</p>';
      html += '<h4>7. Governing law</h4><p>This agreement is governed by the laws of the State of ' + esc(state) + '.</p>';
    } else if (kind === 'nda') {
      html += '<h4>1. Confidential information</h4><p>\u201cConfidential Information\u201d means non-public information shared by one party with the other in connection with: ' + esc(scope) + '. It does not include information that is already public, or that the receiving party already knew.</p>';
      html += '<h4>2. Duty to protect</h4><p>The receiving party will keep Confidential Information private, will not share it with anyone who does not need it for the purpose above, and will use at least the same care to protect it as it uses for its own confidential information.</p>';
      html += '<h4>3. Term</h4><p>This agreement starts on ' + esc(start) + ' and the duty to protect Confidential Information lasts until ' + esc(end) + ', or for 2 years after disclosure, whichever is later.</p>';
      html += '<h4>4. No other rights</h4><p>This agreement does not give either party any right to the other party\u2019s intellectual property, and does not require either party to do business together.</p>';
      html += '<h4>5. Governing law</h4><p>This agreement is governed by the laws of the State of ' + esc(state) + '.</p>';
    } else {
      html += '<h4>1. Services</h4><p>Party A agrees to provide the following services to Party B: ' + esc(scope) + '.</p>';
      html += '<h4>2. Payment</h4><p>Party B agrees to pay Party A ' + esc(amount) + '. Payment terms: ' + esc(terms) + '.</p>';
      html += '<h4>3. Term</h4><p>This agreement starts on ' + esc(start) + ' and ends on ' + esc(end) + '. It renews only if both parties agree in writing.</p>';
      html += '<h4>4. Quality and care</h4><p>Party A will perform the services with reasonable skill and care, and will fix, at no extra charge, any work that does not match the agreed scope when reported within 14 days of delivery.</p>';
      html += '<h4>5. Liability</h4><p>Neither party is liable for indirect or consequential losses. Each party\u2019s total liability under this agreement is limited to the amount paid under section 2.</p>';
      html += '<h4>6. Ending the agreement</h4><p>Either party may end this agreement with 30 days\u2019 written notice, or immediately if the other party materially breaches it and does not fix the breach within 14 days of written notice.</p>';
      html += '<h4>7. Governing law</h4><p>This agreement is governed by the laws of the State of ' + esc(state) + '.</p>';
    }
    html += '<p style="margin-top:20px">Signed:<br><br>Party A (' + esc(a) + '): ______________________&nbsp;&nbsp; Date: __________<br><br>Party B (' + esc(b) + '): ______________________&nbsp;&nbsp; Date: __________</p>';
    preview.innerHTML = html;
    if (val('ct-party-a') || val('ct-party-b')) trackUse();
  }

  ['ct-template', 'ct-party-a', 'ct-party-b', 'ct-scope', 'ct-amount', 'ct-terms', 'ct-start', 'ct-end', 'ct-state'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
    if (el) el.addEventListener('change', render);
  });
  document.getElementById('ct-clear').addEventListener('click', function () {
    ['ct-party-a', 'ct-party-b', 'ct-scope', 'ct-amount', 'ct-terms', 'ct-start', 'ct-end'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    templateEl.value = 'freelance';
    var st = document.getElementById('ct-state');
    if (st) st.value = '';
    hideError();
    render();
    templateEl.focus();
  });
  document.getElementById('ct-print').addEventListener('click', function () {
    if (!val('ct-party-a') || !val('ct-party-b')) { showError('Add both party names before printing.'); return; }
    hideError();
    trackUse();
    window.print();
  });
  render();
})();
