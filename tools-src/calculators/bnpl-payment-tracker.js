/* BNPL Payment Tracker — ToolVerse.
   Loans are stored only in this browser (localStorage). Nothing is
   uploaded. Schedule math is date-based; no random numbers are used. */
(function () {
  'use strict';
  var form = document.getElementById('bnpl-form');
  if (!form) return; // not on this page — safe global include

  var STORE_KEY = 'tv-bnpl-loans-v1';
  var DAY = 24 * 60 * 60 * 1000;

  var providerEl = document.getElementById('bnpl-provider');
  var amountEl = document.getElementById('bnpl-amount');
  var installmentEl = document.getElementById('bnpl-installment');
  var countEl = document.getElementById('bnpl-count');
  var freqEl = document.getElementById('bnpl-frequency');
  var dueEl = document.getElementById('bnpl-due');
  var clearBtn = document.getElementById('bnpl-clear');
  var errorEl = document.getElementById('bnpl-error');
  var ledeEl = document.getElementById('bnpl-lede');
  var totalEl = document.getElementById('bnpl-total');
  var weekEl = document.getElementById('bnpl-week');
  var monthEl = document.getElementById('bnpl-month');
  var loansEl = document.getElementById('bnpl-loans');
  var nextDateEl = document.getElementById('bnpl-next-date');
  var nextProviderEl = document.getElementById('bnpl-next-provider');
  var nextAmountEl = document.getElementById('bnpl-next-amount');
  var warnEl = document.getElementById('bnpl-warning');
  var scheduleEl = document.getElementById('bnpl-schedule');
  var listEl = document.getElementById('bnpl-list');
  var tracked = false;
  var idCounter = 0;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('bnpl-payment-tracker', 'calculators', 'tool_use');
    }
  }

  function money(n) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function dateStr(d) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  function parseDate(s) {
    var parts = s.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function save(loans) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(loans)); } catch (e) { /* storage full/blocked — tracker still works for this visit */ }
  }

  function loanSchedule(loan) {
    // All installments for one loan, starting at its next due date.
    var out = [];
    var d = parseDate(loan.due);
    var step = loan.frequency === 30 ? 30 : 14;
    var remaining = loan.amount;
    for (var i = 0; i < loan.count; i++) {
      var amt = Math.min(loan.installment, remaining);
      if (amt <= 0) break;
      out.push({ date: new Date(d.getTime()), amount: amt, provider: loan.provider });
      remaining = Math.round((remaining - amt) * 100) / 100;
      d = addDays(d, step);
    }
    return out;
  }

  function render() {
    var loans = load();
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var in7 = new Date(now.getTime() + 7 * DAY);
    var in30 = new Date(now.getTime() + 30 * DAY);

    var total = 0;
    var due7 = 0;
    var due30 = 0;
    var all = [];
    loans.forEach(function (loan) {
      total += loan.amount;
      loanSchedule(loan).forEach(function (p) {
        all.push(p);
        if (p.date <= in7) due7 += p.amount;
        if (p.date <= in30) due30 += p.amount;
      });
    });
    all.sort(function (a, b) { return a.date - b.date; });

    if (loans.length === 0) {
      ledeEl.textContent = 'No loans added yet. Add your first loan above.';
      totalEl.textContent = '—'; weekEl.textContent = '—'; monthEl.textContent = '—';
      loansEl.textContent = '0';
      nextDateEl.textContent = '—'; nextProviderEl.textContent = '—'; nextAmountEl.textContent = '—';
      warnEl.hidden = true;
      scheduleEl.innerHTML = '';
      listEl.innerHTML = '';
      return;
    }

    totalEl.textContent = money(total);
    weekEl.textContent = money(due7);
    monthEl.textContent = money(due30);
    loansEl.textContent = String(loans.length);
    if (all.length > 0) {
      nextDateEl.textContent = dateStr(all[0].date);
      nextProviderEl.textContent = all[0].provider;
      nextAmountEl.textContent = money(all[0].amount);
      ledeEl.textContent = 'You owe ' + money(total) + ' across ' + loans.length + ' BNPL loan' + (loans.length > 1 ? 's' : '') + '. Your next payment is ' + money(all[0].amount) + ' to ' + all[0].provider + ' on ' + dateStr(all[0].date) + '.';
    }

    // Warning: two payments within 3 days of each other in the next 30 days.
    var crowded = false;
    for (var i = 1; i < all.length; i++) {
      if (all[i].date <= in30 && (all[i].date - all[i - 1].date) <= 3 * DAY) { crowded = true; break; }
    }
    warnEl.hidden = !crowded;

    var schedHtml = '';
    all.slice(0, 12).forEach(function (p) {
      schedHtml += '<li>' + dateStr(p.date) + ' — ' + p.provider + ' — ' + money(p.amount) + '</li>';
    });
    scheduleEl.innerHTML = schedHtml;

    var listHtml = '';
    loans.forEach(function (loan) {
      listHtml += '<li>' + loan.provider + ' — ' + money(loan.amount) + ' left, ' + money(loan.installment) + ' x ' + loan.count + ' — next due ' + dateStr(parseDate(loan.due)) +
        ' <button type="button" data-remove="' + loan.id + '">Remove</button></li>';
    });
    listEl.innerHTML = listHtml;
  }

  listEl.addEventListener('click', function (ev) {
    var id = ev.target && ev.target.getAttribute ? ev.target.getAttribute('data-remove') : null;
    if (!id) return;
    var loans = load().filter(function (l) { return String(l.id) !== id; });
    save(loans);
    render();
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var amount = parseFloat(amountEl.value);
    var installment = parseFloat(installmentEl.value);
    var count = parseInt(countEl.value, 10);
    var due = dueEl.value;
    if (isNaN(amount) || amount <= 0) {
      errorEl.textContent = 'Enter the amount left to pay (more than $0).';
      errorEl.hidden = false;
      return;
    }
    if (isNaN(installment) || installment <= 0) {
      errorEl.textContent = 'Enter the payment per installment (more than $0).';
      errorEl.hidden = false;
      return;
    }
    if (isNaN(count) || count < 1) {
      errorEl.textContent = 'Enter at least 1 installment left.';
      errorEl.hidden = false;
      return;
    }
    if (!due) {
      errorEl.textContent = 'Pick the next due date.';
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    trackUse();
    var loans = load();
    idCounter += 1;
    loans.push({
      id: 'loan-' + Date.now() + '-' + idCounter,
      provider: providerEl.value,
      amount: Math.round(amount * 100) / 100,
      installment: Math.round(installment * 100) / 100,
      count: count,
      frequency: parseInt(freqEl.value, 10),
      due: due
    });
    save(loans);
    form.reset();
    countEl.value = '4';
    render();
  });

  clearBtn.addEventListener('click', function () {
    save([]);
    render();
  });

  render();
})();
