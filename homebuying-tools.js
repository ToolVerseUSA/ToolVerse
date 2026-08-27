/* ToolVerse home-buying decision tools — educational planning only.
   All inputs and results stay in the browser. This file sends no analytics events or values. */
(function () {
  'use strict';

  const calc = window.ToolVerseCalculations;
  if (!calc) return;

  const money = (value) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(Math.round(Number(value) || 0));
  const signedMoney = (value) => `${Number(value) < 0 ? '−' : ''}${money(Math.abs(Number(value) || 0))}`;
  const pct = (value) => `${(Number(value) || 0).toFixed(1)}%`;
  const byId = (id) => document.getElementById(id);
  const value = (root, selector) => Number(root.querySelector(selector)?.value || 0);

  function populateStates(root) {
    root.querySelectorAll('.state-select').forEach((select) => {
      const selected = select.dataset.defaultState || select.value || 'CA';
      select.innerHTML = '';
      Object.entries(calc.stateNames).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        option.selected = code === selected;
        select.appendChild(option);
      });
    });
  }

  function setError(root, message) {
    const error = root.querySelector('.form-error');
    if (!error) return;
    error.textContent = message || '';
    error.hidden = !message;
  }

  function setResult(root, html, tone) {
    const result = root.querySelector('.tool-result') || root.closest('.calculator-card')?.querySelector('.tool-result');
    if (!result) return;
    result.className = `tool-result result ${tone || 'positive'}`;
    result.innerHTML = html;
    result.hidden = false;
    result.focus({preventScroll:true});
  }

  function validateNumbers(root, selector = 'input[type="number"]') {
    for (const input of root.querySelectorAll(selector)) {
      const raw = input.value.trim();
      const numeric = Number(raw === '' ? 0 : raw);
      const limit = Number(input.max || calc.MAX_MONEY);
      const min = Number(input.min || 0);
      if (!Number.isFinite(numeric) || numeric < min || numeric > limit) {
        return `${input.dataset.label || 'Each amount'} must be a number from ${money(min)} to ${money(limit)}.`;
      }
    }
    return '';
  }

  function mortgagePayment(principal, annualRate, years) {
    const loan = calc.nonNegative(principal, calc.MAX_ANNUAL_GROSS);
    const rate = Math.max(0, Math.min(30, Number(annualRate) || 0)) / 100 / 12;
    const months = Math.round(Math.max(1, Math.min(50, Number(years) || 0)) * 12);
    if (!loan || !months) return 0;
    if (!rate) return loan / months;
    const factor = Math.pow(1 + rate, months);
    return loan * ((rate * factor) / (factor - 1));
  }

  function amortization(principal, annualRate, years, monthsElapsed) {
    const loan = calc.nonNegative(principal, calc.MAX_ANNUAL_GROSS);
    const rate = Math.max(0, Math.min(30, Number(annualRate) || 0)) / 100 / 12;
    const totalMonths = Math.round(Math.max(1, Math.min(50, Number(years) || 0)) * 12);
    const elapsed = Math.max(0, Math.min(totalMonths, Math.round(monthsElapsed || 0)));
    const payment = mortgagePayment(loan, annualRate, years);
    if (!rate) {
      const balance = Math.max(0, loan - (loan / totalMonths) * elapsed);
      return {payment, balance, principalPaid: loan - balance, interestPaid: payment * elapsed - (loan - balance)};
    }
    const factor = Math.pow(1 + rate, elapsed);
    const balance = Math.max(0, loan * factor - payment * ((factor - 1) / rate));
    const principalPaid = Math.max(0, loan - balance);
    return {payment, balance, principalPaid, interestPaid: Math.max(0, payment * elapsed - principalPaid)};
  }

  function allInPayment(input) {
    const price = calc.nonNegative(input.price, calc.MAX_ANNUAL_GROSS);
    const downPayment = Math.min(price, calc.nonNegative(input.downPayment, calc.MAX_ANNUAL_GROSS));
    const loan = Math.max(0, price - downPayment);
    const principalInterest = mortgagePayment(loan, input.rate, input.years);
    const propertyTax = calc.nonNegative(input.propertyTax) / 12;
    const insurance = calc.nonNegative(input.insurance) / 12;
    const hoa = calc.nonNegative(input.hoa);
    const maintenance = calc.nonNegative(input.maintenance);
    const mortgageInsurance = calc.nonNegative(input.mortgageInsurance);
    const total = principalInterest + propertyTax + insurance + hoa + maintenance + mortgageInsurance;
    return {price, downPayment, loan, principalInterest, propertyTax, insurance, hoa, maintenance, mortgageInsurance, total};
  }

  function card(title, rows, note) {
    const list = rows.map(([label, amount]) => `<div><dt>${label}</dt><dd>${amount}</dd></div>`).join('');
    return `<div class="result-grid-card"><h3>${title}</h3><dl>${list}</dl>${note ? `<p class="result-note">${note}</p>` : ''}</div>`;
  }

  function initMortgagePayment() {
    const form = byId('mortgage-payment-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = validateNumbers(form);
      if (error) return setError(form, error);
      const price = value(form, '[name="home-price"]');
      const down = value(form, '[name="down-payment"]');
      if (price <= 0) return setError(form, 'Enter a home price greater than $0.');
      if (down > price) return setError(form, 'Down payment cannot be greater than the home price.');
      const result = allInPayment({
        price, downPayment: down, rate: value(form, '[name="interest-rate"]'), years: value(form, '[name="loan-term"]'),
        propertyTax: value(form, '[name="property-tax"]'), insurance: value(form, '[name="insurance"]'), hoa: value(form, '[name="hoa"]'),
        maintenance: value(form, '[name="maintenance"]'), mortgageInsurance: value(form, '[name="mortgage-insurance"]')
      });
      setError(form, '');
      setResult(form, `<h2>Estimated monthly home payment</h2><div class="result-grid">${card('Loan structure', [['Home price',money(result.price)],['Down payment',money(result.downPayment)],['Estimated loan amount',money(result.loan)],['Down payment share',pct(result.price ? result.downPayment / result.price * 100 : 0)]])}${card('Monthly payment view', [['Principal and interest',money(result.principalInterest)],['Property tax estimate',money(result.propertyTax)],['Homeowners insurance estimate',money(result.insurance)],['HOA / condo dues',money(result.hoa)],['Maintenance reserve',money(result.maintenance)],['Mortgage insurance',money(result.mortgageInsurance)]])}</div><div class="result-summary"><strong>Estimated all-in monthly housing cost</strong><span>${money(result.total)}</span></div><p class="result-note">This is a planning estimate based on the figures entered. It does not quote a loan, calculate APR, include every fee, guarantee escrow amounts, or determine loan approval.</p>`, 'positive');
    });
  }

  function initHomeAffordability() {
    const form = byId('home-affordability-form');
    if (!form) return;
    populateStates(form);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = validateNumbers(form);
      if (error) return setError(form, error);
      const annualGross = value(form, '[name="income"]');
      if (annualGross <= 0) return setError(form, 'Enter an annual income greater than $0.');
      const scenario = calc.evaluateScenario({annualGross, state: form.querySelector('[name="state"]').value, filingStatus: form.querySelector('[name="filing-status"]').value, debt: value(form, '[name="debt"]'), otherExpenses: value(form, '[name="other-expenses"]'), monthlySavingsGoal: value(form, '[name="savings-goal"]')});
      const housingLimit = Math.max(0, Math.min(scenario.monthlyTakeHome * (Math.max(10, Math.min(60, value(form, '[name="housing-share"]'))) / 100), scenario.monthlyTakeHome - scenario.debt - scenario.otherExpenses - scenario.monthlySavingsGoal));
      const downPayment = value(form, '[name="down-payment"]');
      const rate = value(form, '[name="interest-rate"]');
      const years = value(form, '[name="loan-term"]');
      const monthlyNonPI = value(form, '[name="property-tax"]') / 12 + value(form, '[name="insurance"]') / 12 + value(form, '[name="hoa"]') + value(form, '[name="maintenance"]') + value(form, '[name="mortgage-insurance"]');
      let low = 0, high = calc.MAX_ANNUAL_GROSS, best = 0;
      for (let i = 0; i < 70; i += 1) {
        const candidate = (low + high) / 2;
        const monthly = mortgagePayment(Math.max(0, candidate - Math.min(candidate, downPayment)), rate, years) + monthlyNonPI;
        if (monthly <= housingLimit) { best = candidate; low = candidate; } else high = candidate;
      }
      const payment = allInPayment({price:best, downPayment:Math.min(best, downPayment), rate, years, propertyTax:value(form, '[name="property-tax"]'), insurance:value(form, '[name="insurance"]'), hoa:value(form, '[name="hoa"]'), maintenance:value(form, '[name="maintenance"]'), mortgageInsurance:value(form, '[name="mortgage-insurance"]')});
      const remaining = scenario.monthlyTakeHome - scenario.debt - scenario.otherExpenses - scenario.monthlySavingsGoal - payment.total;
      setError(form, '');
      setResult(form, `<h2>Home-budget planning result</h2><div class="result-grid">${card('Your monthly planning limit', [['Est. monthly take-home',money(scenario.monthlyTakeHome)],['Debt and other entered costs',money(scenario.debt + scenario.otherExpenses)],['Savings / buffer goal',money(scenario.monthlySavingsGoal)],['Housing-cost planning limit',money(housingLimit)]], 'The result uses the lower of your selected take-home housing share and the cash left after entered costs.')}${card('Price and payment estimate', [['Estimated maximum home price',money(best)],['Down payment applied',money(payment.downPayment)],['Estimated loan amount',money(payment.loan)],['Principal and interest',money(payment.principalInterest)],['All-in monthly home cost',money(payment.total)],['Monthly room after entered costs',signedMoney(remaining)]])}</div><p class="result-note">This calculation is a budget-planning exercise. It does not assess credit, underwriting rules, loan program eligibility, debt-to-income standards, local taxes, future rates, closing costs, or lender approval.</p>`, remaining < 0 || best <= 0 ? 'warning' : 'positive');
    });
  }

  function initDownPayment() {
    const form = byId('down-payment-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = validateNumbers(form);
      if (error) return setError(form, error);
      const price = value(form, '[name="home-price"]');
      if (price <= 0) return setError(form, 'Enter a home price greater than $0.');
      const downPercent = Math.max(0, Math.min(100, value(form, '[name="down-payment-percent"]')));
      const downPayment = price * downPercent / 100;
      const closing = price * Math.max(0, Math.min(25, value(form, '[name="closing-percent"]'))) / 100;
      const cashGoal = downPayment + closing + value(form, '[name="moving-reserve"]');
      const savings = value(form, '[name="savings"]');
      const monthly = value(form, '[name="monthly-savings"]');
      const gap = Math.max(0, cashGoal - savings);
      const months = gap === 0 ? 0 : monthly > 0 ? Math.ceil(gap / monthly) : null;
      setError(form, '');
      setResult(form, `<h2>Down-payment planning result</h2><div class="result-grid">${card('Home purchase cash target', [['Home price',money(price)],['Down payment',money(downPayment)],['Entered closing-cost estimate',money(closing)],['Moving / reserve amount',money(value(form, '[name="moving-reserve"]'))],['Total cash target',money(cashGoal)]])}${card('Savings path', [['Current savings',money(savings)],['Remaining gap',money(gap)],['Monthly savings contribution',money(monthly)],['Time to target',months === null ? 'Enter a monthly savings amount' : `${months} month${months === 1 ? '' : 's'}`],['Estimated loan amount',money(Math.max(0, price - downPayment))]])}</div><p class="result-note">Closing-cost percentage, moving costs, available savings, and contribution pace are assumptions you control. Verify cash-to-close figures with your lender and closing professional before acting.</p>`, gap > 0 ? 'warning' : 'positive');
    });
  }

  function initClosingCosts() {
    const form = byId('closing-costs-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = validateNumbers(form);
      if (error) return setError(form, error);
      const price = value(form, '[name="home-price"]');
      if (price <= 0) return setError(form, 'Enter a home price greater than $0.');
      const down = value(form, '[name="down-payment"]');
      if (down > price) return setError(form, 'Down payment cannot be greater than the home price.');
      const costs = ['lender-fees','appraisal','title-settlement','government-fees','prepaids','initial-escrow','other-fees'].reduce((sum, name) => sum + calc.nonNegative(value(form, `[name="${name}"]`)), 0);
      const credits = calc.nonNegative(value(form, '[name="credits"]'));
      const netClosing = Math.max(0, costs - credits);
      const cashToClose = down + netClosing;
      setError(form, '');
      setResult(form, `<h2>Cash-to-close planning result</h2><div class="result-grid">${card('Entered closing items', [['Lender / origination fees',money(value(form, '[name="lender-fees"]'))],['Appraisal',money(value(form, '[name="appraisal"]'))],['Title / settlement',money(value(form, '[name="title-settlement"]'))],['Government fees',money(value(form, '[name="government-fees"]'))],['Prepaids',money(value(form, '[name="prepaids"]'))],['Initial escrow',money(value(form, '[name="initial-escrow"]'))],['Other entered fees',money(value(form, '[name="other-fees"]'))]])}${card('Planning summary', [['Home price',money(price)],['Down payment',money(down)],['Total entered closing items',money(costs)],['Entered credits',money(credits)],['Net closing estimate',money(netClosing)],['Estimated cash to close',money(cashToClose)],['Cash-to-close share of price',pct(cashToClose / price * 100)]])}</div><p class="result-note">This organizes the amounts you enter. Loan Estimate and Closing Disclosure figures control; credits can affect other terms, and actual charges vary by transaction and state.</p>`, 'positive');
    });
  }

  function initRentVsBuy() {
    const form = byId('rent-vs-buy-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = validateNumbers(form);
      if (error) return setError(form, error);
      const price = value(form, '[name="home-price"]');
      const down = value(form, '[name="down-payment"]');
      if (price <= 0) return setError(form, 'Enter a home price greater than $0.');
      if (down > price) return setError(form, 'Down payment cannot be greater than the home price.');
      const yearsHeld = Math.max(1, Math.min(30, Math.round(value(form, '[name="years-held"]'))));
      const months = yearsHeld * 12;
      const owner = allInPayment({price, downPayment:down, rate:value(form, '[name="interest-rate"]'), years:value(form, '[name="loan-term"]'), propertyTax:value(form, '[name="property-tax"]'), insurance:value(form, '[name="insurance"]'), hoa:value(form, '[name="hoa"]'), maintenance:value(form, '[name="maintenance"]'), mortgageInsurance:value(form, '[name="mortgage-insurance"]')});
      const closing = value(form, '[name="closing-costs"]');
      const rent = value(form, '[name="rent"]');
      const renterInsurance = value(form, '[name="renter-insurance"]');
      const rentIncrease = Math.max(0, Math.min(20, value(form, '[name="rent-increase"]'))) / 100;
      const ownershipIncrease = Math.max(0, Math.min(20, value(form, '[name="ownership-increase"]'))) / 100;
      let rentingCash = value(form, '[name="rental-move-in"]');
      let ownerCash = down + closing;
      for (let year = 0; year < yearsHeld; year += 1) {
        rentingCash += (rent + renterInsurance) * 12 * Math.pow(1 + rentIncrease, year);
        ownerCash += owner.total * 12 * Math.pow(1 + ownershipIncrease, year);
      }
      const amortized = amortization(owner.loan, value(form, '[name="interest-rate"]'), value(form, '[name="loan-term"]'), months);
      const difference = ownerCash - rentingCash;
      setError(form, '');
      const yearWord = yearsHeld === 1 ? 'year' : 'years';
      setResult(form, `<h2>${yearsHeld}-${yearWord} cash-flow comparison</h2><p class="result-lede">Based only on the assumptions entered, buying has ${difference > 0 ? 'a higher' : difference < 0 ? 'a lower' : 'the same'} estimated cash outlay by ${money(Math.abs(difference))} over ${yearsHeld} ${yearWord}.</p><div class="result-grid">${card('Buying scenario', [['Up-front down payment',money(down)],['Entered closing costs',money(closing)],['Initial all-in monthly cost',money(owner.total)],['Cumulative cash paid',money(ownerCash)],['Mortgage principal paid',money(amortized.principalPaid)],['Estimated loan balance',money(amortized.balance)]])}${card('Renting scenario', [['Initial move-in cash',money(value(form, '[name="rental-move-in"]'))],['Initial rent + renter insurance',money(rent + renterInsurance)],['Annual rent increase entered',pct(rentIncrease * 100)],['Cumulative cash paid',money(rentingCash)],['Difference versus buying',signedMoney(rentingCash - ownerCash)]])}</div><p class="result-note">This is a cash-flow comparison, not an investment return. It excludes property value changes, resale costs, tax effects, investment returns, loan approval, maintenance surprises, landlord responsibilities, and non-financial reasons to rent or buy.</p>`, 'warning');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMortgagePayment();
    initHomeAffordability();
    initDownPayment();
    initClosingCosts();
    initRentVsBuy();
  });
})();
