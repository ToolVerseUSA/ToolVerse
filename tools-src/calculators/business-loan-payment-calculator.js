/* Business Loan Payment Calculator. Standard fixed-rate amortization; extra payments go to principal. */
(function () {
  'use strict';
  var form = document.getElementById('business-loan-payment-calculator-form');
  if (!form) return; // not on this page, safe global include


  var errorEl = document.getElementById('business-loan-payment-calculator-error');
  var ledeEl = document.getElementById('business-loan-payment-calculator-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('business-loan-payment-calculator', 'calculators', 'tool_use');
    }
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

  function fmtMoney(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  function fmtNum(value) {
    return value.toLocaleString('en-US');
  }
  function fmtPct(value) {
    return value.toFixed(1) + '%';
  }

  var amountEl = document.getElementById('business-loan-payment-calculator-amount');
  var rateEl = document.getElementById('business-loan-payment-calculator-rate');
  var yearsEl = document.getElementById('business-loan-payment-calculator-years');
  var extraEl = document.getElementById('business-loan-payment-calculator-extra');
  var paymentEl = document.getElementById('business-loan-payment-calculator-payment');
  var paymentExtraEl = document.getElementById('business-loan-payment-calculator-payment-extra');
  var interestEl = document.getElementById('business-loan-payment-calculator-interest');
  var totalEl = document.getElementById('business-loan-payment-calculator-total');
  var monthsEl = document.getElementById('business-loan-payment-calculator-months');
  var monthsExtraEl = document.getElementById('business-loan-payment-calculator-months-extra');
  var savedEl = document.getElementById('business-loan-payment-calculator-saved');
  var monthsSavedEl = document.getElementById('business-loan-payment-calculator-months-saved');
  var tableEl = document.getElementById('business-loan-payment-calculator-table');

  function basePayment(principal, monthlyRate, n) {
    if (monthlyRate === 0) { return principal / n; }
    var f = Math.pow(1 + monthlyRate, n);
    return principal * monthlyRate * f / (f - 1);
  }

  function simulate(principal, monthlyRate, payment, maxMonths) {
    var balance = principal;
    var totalInterest = 0;
    var months = 0;
    var firstInterest = 0;
    var firstPrincipal = 0;
    var lastInterest = 0;
    var lastPrincipal = 0;
    var year = 0;
    while (balance > 0.005 && months < maxMonths) {
      var yInt = 0;
      var yPrin = 0;
      for (var m = 0; m < 12 && balance > 0.005 && months < maxMonths; m++) {
        var interest = balance * monthlyRate;
        var prin = payment - interest;
        if (prin > balance) { prin = balance; }
        if (prin < 0) { prin = 0; }
        balance -= prin;
        totalInterest += interest;
        yInt += interest;
        yPrin += prin;
        months++;
      }
      year++;
      if (year === 1) { firstInterest = yInt; firstPrincipal = yPrin; }
      lastInterest = yInt;
      lastPrincipal = yPrin;
    }
    return { months: months, interest: totalInterest, firstInterest: firstInterest,
      firstPrincipal: firstPrincipal, lastInterest: lastInterest, lastPrincipal: lastPrincipal,
      endBalance: balance, years: year };
  }

  function fmtMonths(n) {
    var y = Math.floor(n / 12);
    var m = n % 12;
    if (y === 0) { return m + ' months'; }
    if (m === 0) { return y + (y === 1 ? ' year' : ' years'); }
    return y + (y === 1 ? ' year' : ' years') + ', ' + m + ' months';
  }

  function calculate() {
    hideError();
    var amount = parseFloat(amountEl.value);
    var rate = parseFloat(rateEl.value);
    var years = parseInt(yearsEl.value, 10);
    var extra = extraEl.value === '' ? 0 : parseFloat(extraEl.value);
    if (isNaN(amount) || amount <= 0) {
      showError('Enter a valid loan amount (more than 0).');
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 50) {
      showError('Enter a valid annual interest rate between 0% and 50%.');
      return;
    }
    if (isNaN(years) || years < 1 || years > 40) {
      showError('Enter a whole number of years between 1 and 40.');
      return;
    }
    if (isNaN(extra) || extra < 0) {
      showError('Enter a valid extra monthly payment (0 or more).');
      return;
    }
    var monthlyRate = rate / 100 / 12;
    var n = years * 12;
    var payment = basePayment(amount, monthlyRate, n);
    if (payment + extra <= amount * monthlyRate && monthlyRate > 0) {
      showError('The payment does not cover the monthly interest, so the loan would never pay off. Raise the extra payment or shorten the term.');
      return;
    }
    var plain = simulate(amount, monthlyRate, payment, n * 2 + 600);
    var withExtra = simulate(amount, monthlyRate, payment + extra, n * 2 + 600);
    var interestSaved = plain.interest - withExtra.interest;
    paymentEl.textContent = fmtMoney(payment);
    paymentExtraEl.textContent = extra > 0 ? fmtMoney(payment + extra) : 'No extra payment entered';
    interestEl.textContent = fmtMoney(plain.interest);
    totalEl.textContent = fmtMoney(amount + plain.interest);
    monthsEl.textContent = fmtMonths(plain.months) + ' (' + plain.months + ' payments)';
    monthsExtraEl.textContent = extra > 0 ? fmtMonths(withExtra.months) + ' (' + withExtra.months + ' payments)' : 'No extra payment entered';
    savedEl.textContent = extra > 0 ? fmtMoney(interestSaved) : 'No extra payment entered';
    monthsSavedEl.textContent = extra > 0 ? (plain.months - withExtra.months) + ' months' : 'No extra payment entered';
    var rows = '<tr><td>First year</td><td>' + fmtMoney(plain.firstInterest) + '</td><td>' +
      fmtMoney(plain.firstPrincipal) + '</td><td>' + fmtMoney(amount - plain.firstPrincipal) + '</td></tr>';
    rows += '<tr><td>Last year</td><td>' + fmtMoney(plain.lastInterest) + '</td><td>' +
      fmtMoney(plain.lastPrincipal) + '</td><td>' + fmtMoney(plain.endBalance) + '</td></tr>';
    tableEl.innerHTML = rows;
    ledeEl.textContent = 'On a ' + fmtMoney(amount) + ' loan at ' + rate + '% for ' + years +
      ' years, the monthly payment is ' + fmtMoney(payment) + ' and total interest is ' + fmtMoney(plain.interest) + '.';
    trackUse();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });
})();
