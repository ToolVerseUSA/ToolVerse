/* Budget Planner — browser-local monthly budget with 50/30/20 breakdown.
   No data leaves the page. 50/30/20 is a planning guideline, not financial advice. */
(function () {
  'use strict';
  var payEl = document.getElementById('bp-pay');
  if (!payEl) return; // not on this page — safe global include

  var ids = ['bp-housing', 'bp-utilities', 'bp-food', 'bp-transport', 'bp-debt', 'bp-entertainment', 'bp-other'];
  var goalEl = document.getElementById('bp-goal');
  var goalDateEl = document.getElementById('bp-goal-date');
  var errorEl = document.getElementById('bp-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('budget-planner', 'business', 'tool_use');
    }
  }

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(el.value);
    if (isNaN(v)) return 0;
    return v < 0 ? 0 : v;
  }

  function money(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(part, whole) {
    if (!whole || whole <= 0) return 0;
    return (part / whole) * 100;
  }

  function pctText(p) {
    return p.toFixed(1) + '%';
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setBar(id, p) {
    var el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, p)) + '%';
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
    var pay = num('bp-pay');
    var needs = num('bp-housing') + num('bp-utilities') + num('bp-food') + num('bp-transport') + num('bp-debt');
    var wants = num('bp-entertainment') + num('bp-other');
    var total = needs + wants;
    var left = pay - total;

    var negative = false;
    [payEl, goalEl].concat(ids.map(function (id) { return document.getElementById(id); })).forEach(function (el) {
      if (el && el.value !== '' && parseFloat(el.value) < 0) negative = true;
    });
    if (negative) showError('Amounts cannot be negative — negative values are counted as $0.');
    else hideError();

    setText('bp-total', money(total));
    setText('bp-left', money(left));
    setText('bp-left-pct', pay > 0 ? pctText(pct(left, pay)) : '0%');
    setText('bp-needs', money(needs));
    setText('bp-needs-pct', pctText(pct(needs, pay)));
    setText('bp-wants', money(wants));
    setText('bp-wants-pct', pctText(pct(wants, pay)));
    setText('bp-savings', money(left));
    setText('bp-savings-pct', pctText(pct(left, pay)));
    setBar('bp-bar-needs', pct(needs, pay));
    setBar('bp-bar-wants', pct(wants, pay));
    setBar('bp-bar-savings', pct(left, pay));

    // Savings goal
    var goal = num('bp-goal');
    var noteEl = document.getElementById('bp-goal-note');
    if (goal <= 0) {
      setText('bp-goal-out', '—');
      setText('bp-goal-monthly', '—');
      if (noteEl) noteEl.textContent = 'Add a goal amount and target date to see your monthly saving target.';
    } else {
      setText('bp-goal-out', money(goal));
      var dateVal = goalDateEl ? goalDateEl.value : '';
      if (!dateVal) {
        setText('bp-goal-monthly', '—');
        if (noteEl) noteEl.textContent = 'Add a target date to work out how much to save each month.';
      } else {
        var parts = dateVal.split('-');
        var target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
        if (days <= 0) {
          setText('bp-goal-monthly', '—');
          if (noteEl) noteEl.textContent = 'That target date is in the past — pick a future date.';
        } else {
          var months = Math.max(1, Math.ceil(days / 30.4375));
          setText('bp-goal-monthly', money(goal / months) + ' / mo');
          if (noteEl) noteEl.textContent = 'Save ' + money(goal / months) + ' a month for about ' + months + ' month' + (months === 1 ? '' : 's') + ' to reach ' + money(goal) + ' by ' + target.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '.';
        }
      }
    }

    if (pay > 0) trackUse();
  }

  [payEl, goalEl, goalDateEl].concat(ids.map(function (id) { return document.getElementById(id); })).forEach(function (el) {
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });

  var printBtn = document.getElementById('bp-print');
  if (printBtn) printBtn.addEventListener('click', function () { trackUse(); window.print(); });

  var clearBtn = document.getElementById('bp-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    [payEl, goalEl, goalDateEl].concat(ids.map(function (id) { return document.getElementById(id); })).forEach(function (el) {
      if (el) el.value = '';
    });
    hideError();
    render();
    payEl.focus();
  });

  render();
})();
