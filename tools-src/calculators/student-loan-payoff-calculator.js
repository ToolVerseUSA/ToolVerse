/* Student Loan Payoff Calculator — standard amortization math, all in
   the browser. Nothing is uploaded or stored. Estimate only: confirm your
   balance and rate with your loan servicer. */
(function () {
  'use strict';
  var form = document.getElementById('slp-form');
  if (!form) return; // not on this page — safe global include

  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('student-loan-payoff-calculator', 'calculators', 'tool_use');
    }
  }

  var errorEl = document.getElementById('slp-error');

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

  function fmtMoney(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var v = parseFloat(el.value);
    return isNaN(v) ? NaN : v;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* Months to pay off balance B at monthly rate r with payment P.
     Returns null when the payment never covers the monthly interest. */
  function payoffMonths(balance, monthlyRate, payment) {
    if (monthlyRate === 0) {
      if (payment <= 0) return null;
      return balance / payment;
    }
    if (payment <= monthlyRate * balance) return null;
    return -Math.log(1 - monthlyRate * balance / payment) / Math.log(1 + monthlyRate);
  }

  function payoffDate(months) {
    var d = new Date();
    d.setMonth(d.getMonth() + Math.ceil(months));
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  /* Simulate two loans month by month. Each month, interest accrues on
     both balances, each loan's interest is covered first, and the rest of
     the total payment attacks the target loan until it is gone, then the
     other loan. targetFirst: 0 = loan 1 first, 1 = loan 2 first.
     Returns { months, interest } or null when the payment never covers
     the combined monthly interest. */
  function simulateTwoLoans(b1, r1, b2, r2, totalPayment) {
    var balances = [b1, b2];
    var rates = [r1, r2];
    var first = arguments.length > 5 ? arguments[5] : 0;
    var months = 0;
    var totalInterest = 0;
    var maxMonths = 1200;
    while ((balances[0] > 0.005 || balances[1] > 0.005) && months < maxMonths) {
      var interest = [balances[0] * rates[0], balances[1] * rates[1]];
      if (totalPayment <= interest[0] + interest[1]) return null;
      totalInterest += interest[0] + interest[1];
      balances[0] += interest[0];
      balances[1] += interest[1];
      var remaining = totalPayment;
      // Cover each loan's interest first.
      for (var i = 0; i < 2; i++) {
        var cover = Math.min(interest[i], balances[i], remaining);
        balances[i] -= cover;
        remaining -= cover;
      }
      // Attack the target loan, then the other one.
      var order = first === 0 ? [0, 1] : [1, 0];
      for (var j = 0; j < 2 && remaining > 0; j++) {
        var idx = order[j];
        var pay = Math.min(balances[idx], remaining);
        balances[idx] -= pay;
        remaining -= pay;
      }
      months++;
    }
    if (balances[0] > 0.005 || balances[1] > 0.005) return null;
    return { months: months, interest: totalInterest };
  }

  function pickTarget(balances, rates, method) {
    // Avalanche: highest rate first. Snowball: smallest balance first.
    if (method === 'avalanche') return rates[0] >= rates[1] ? 0 : 1;
    return balances[0] <= balances[1] ? 0 : 1;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var balance = num('slp-balance');
    var apr = num('slp-apr');
    var payment = num('slp-payment');
    var extra = num('slp-extra');
    if (isNaN(extra) || extra < 0) extra = 0;

    if (isNaN(balance) || balance <= 0) {
      showError('Enter a loan balance greater than $0.');
      return;
    }
    if (isNaN(apr) || apr < 0 || apr > 100) {
      showError('Enter an annual interest rate between 0% and 100%.');
      return;
    }
    if (isNaN(payment) || payment <= 0) {
      showError('Enter a monthly payment greater than $0.');
      return;
    }

    var r = apr / 100 / 12;
    var months = payoffMonths(balance, r, payment);
    if (months === null) {
      showError('Your monthly payment does not cover the monthly interest (' + fmtMoney(balance * r) + ' per month), so this loan would never pay off. Your payment must be more than the monthly interest.');
      return;
    }
    var totalPaid = months * payment;
    var totalInterest = totalPaid - balance;

    setText('slp-lede', 'With a ' + fmtMoney(payment) + ' monthly payment, your loan is paid off in about ' + Math.ceil(months) + ' months.');
    setText('slp-months', String(Math.ceil(months)));
    setText('slp-date', payoffDate(months));
    setText('slp-interest', fmtMoney(totalInterest));
    setText('slp-total', fmtMoney(totalPaid));

    if (extra > 0) {
      var monthsExtra = payoffMonths(balance, r, payment + extra);
      if (monthsExtra === null) {
        setText('slp-extra-months', '—');
        setText('slp-extra-date', '—');
        setText('slp-extra-interest', '—');
        setText('slp-months-saved', '—');
        setText('slp-interest-saved', '—');
      } else {
        var totalPaidExtra = monthsExtra * (payment + extra);
        var totalInterestExtra = totalPaidExtra - balance;
        setText('slp-extra-months', String(Math.ceil(monthsExtra)));
        setText('slp-extra-date', payoffDate(monthsExtra));
        setText('slp-extra-interest', fmtMoney(totalInterestExtra));
        setText('slp-months-saved', String(Math.max(0, Math.ceil(months) - Math.ceil(monthsExtra))));
        setText('slp-interest-saved', fmtMoney(Math.max(0, totalInterest - totalInterestExtra)));
      }
    } else {
      setText('slp-extra-months', 'Add an extra payment above to compare.');
      setText('slp-extra-date', '—');
      setText('slp-extra-interest', '—');
      setText('slp-months-saved', '—');
      setText('slp-interest-saved', '—');
    }

    // Avalanche vs snowball — only when a second loan and a total payment are given.
    var balance2 = num('slp-balance2');
    var apr2 = num('slp-apr2');
    var totalPayment = num('slp-total-payment');
    var compareEl = document.getElementById('slp-compare');
    var hasSecond = !isNaN(balance2) && balance2 > 0 && !isNaN(apr2) && apr2 >= 0 && apr2 <= 100 &&
      !isNaN(totalPayment) && totalPayment > 0;
    if (hasSecond) {
      var r2 = apr2 / 100 / 12;
      var balances = [balance, balance2];
      var rates = [r, r2];
      var avFirst = pickTarget(balances, rates, 'avalanche');
      var snFirst = pickTarget(balances, rates, 'snowball');
      var av = simulateTwoLoans(balance, r, balance2, r2, totalPayment, avFirst);
      var sn = simulateTwoLoans(balance, r, balance2, r2, totalPayment, snFirst);
      if (av === null || sn === null) {
        showError('Your total monthly payment for both loans does not cover the combined monthly interest (' + fmtMoney(balance * r + balance2 * r2) + ' per month), so the loans would never pay off. Increase the total payment.');
        if (compareEl) compareEl.hidden = true;
        return;
      }
      var names = ['Loan 1 (' + fmtMoney(balance) + ' at ' + apr + '%)', 'Loan 2 (' + fmtMoney(balance2) + ' at ' + apr2 + '%)'];
      setText('slp-compare-lede', 'Both loans, ' + fmtMoney(totalPayment) + ' per month in total. Avalanche attacks the highest rate first; snowball attacks the smallest balance first.');
      setText('slp-av-first', names[avFirst]);
      setText('slp-av-months', String(av.months));
      setText('slp-av-interest', fmtMoney(av.interest));
      setText('slp-sn-first', names[snFirst]);
      setText('slp-sn-months', String(sn.months));
      setText('slp-sn-interest', fmtMoney(sn.interest));
      var diff = sn.interest - av.interest;
      if (diff > 0.01) {
        setText('slp-compare-verdict', 'Avalanche wins by ' + fmtMoney(diff) + ' in interest — and pays both loans off ' + Math.max(0, sn.months - av.months) + ' month(s) sooner. Snowball can still be the better choice if clearing a small loan first keeps you motivated.');
      } else if (diff < -0.01) {
        setText('slp-compare-verdict', 'Snowball wins by ' + fmtMoney(-diff) + ' in interest here. When rates are close, the order matters less than paying consistently.');
      } else {
        setText('slp-compare-verdict', 'Both methods cost about the same in interest here — pick the one that keeps you motivated.');
      }
      if (compareEl) compareEl.hidden = false;
    } else if (compareEl) {
      compareEl.hidden = true;
    }

    trackUse();
  });
})();
