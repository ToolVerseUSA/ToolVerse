/* ToolVerse decision-tool UI controller.
   This file never sends form values, results, or events to analytics. All calculations remain in the browser. */
(function () {
  'use strict';

  const calc = window.ToolVerseCalculations;
  if (!calc) return;

  const money = (value) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(Math.round(Number(value) || 0));
  const signedMoney = (value) => `${value < 0 ? '−' : ''}${money(Math.abs(value))}`;
  const pct = (value) => `${((Number(value) || 0) * 100).toFixed(1)}%`;
  const byId = (id) => document.getElementById(id);

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

  function value(root, selector) {
    return Number(root.querySelector(selector)?.value || 0);
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

  function validateNumbers(root, selector) {
    const inputs = typeof selector === 'string' ? root.querySelectorAll(selector) : selector;
    for (const input of inputs) {
      if (!input) continue;
      const raw = input.value.trim();
      const number = Number(raw === '' ? 0 : raw);
      if (!Number.isFinite(number) || number < 0 || number > calc.MAX_MONEY) {
        return `${input.dataset.label || 'Each amount'} must be a number from $0 to $1,000,000.`;
      }
    }
    return '';
  }

  function bindIncomeMode(root, modeSelector, hoursWrapSelector) {
    const mode = root.querySelector(modeSelector);
    const wrap = root.querySelector(hoursWrapSelector);
    if (!mode || !wrap) return;
    const update = () => { wrap.hidden = mode.value !== 'hourly'; };
    mode.addEventListener('change', update);
    update();
  }

  function scenarioFromOffer(form, offer) {
    const field = (name) => `[data-offer="${offer}"][data-key="${name}"]`;
    const mode = form.querySelector(field('income-mode')).value;
    const annualGross = calc.annualizeIncome(value(form, field('income')), mode, value(form, field('hours')) || 40);
    if (!Number.isFinite(annualGross)) return {error:`Enter a valid positive income and, for hourly pay, hours per week for Offer ${offer.toUpperCase()}.`};
    const scenario = calc.evaluateScenario({
      annualGross,
      state: form.querySelector(field('state')).value,
      filingStatus: form.querySelector(field('filing-status')).value,
      rent: value(form, field('rent')),
      debt: value(form, field('debt')),
      healthBenefits: value(form, field('benefits')),
      transportation: value(form, field('transportation')),
      utilities: value(form, field('utilities')),
      otherExpenses: value(form, field('other')),
      monthlySavingsGoal: 0
    });
    const relocation = calc.nonNegative(value(form, field('relocation')));
    const reserve = calc.nonNegative(value(form, field('reserve')));
    return {scenario, relocation, reserve, cashAfterRelocation: reserve - relocation};
  }

  function scenarioCard(label, result) {
    const s = result.scenario;
    const fixed = calc.classifyMonthlyPosition(s.remaining, s.monthlyTakeHome);
    return `<div class="result-grid-card"><h3>Offer ${label}</h3><dl><div><dt>Est. annual take-home</dt><dd>${money(s.annualTakeHome)}</dd></div><div><dt>Est. monthly take-home</dt><dd>${money(s.monthlyTakeHome)}</dd></div><div><dt>Recurring monthly costs</dt><dd>${money(s.totalRecurring)}</dd></div><div><dt>Monthly cash remaining</dt><dd>${signedMoney(s.remaining)}</dd></div><div><dt>Housing ratio</dt><dd>${pct(s.housingRatio)}</dd></div><div><dt>Fixed-cost pressure</dt><dd>${pct(s.fixedCostPressure)}</dd></div></dl><p class="result-note"><strong>${fixed.label}:</strong> ${fixed.message}</p>${result.relocation || result.reserve ? `<p class="result-note">One-time relocation: ${money(result.relocation)}. Entered cash reserve after that cost: ${signedMoney(result.cashAfterRelocation)}.</p>` : ''}</div>`;
  }

  function initJobOffer() {
    const form = byId('job-offer-form');
    if (!form) return;
    populateStates(form);
    ['a','b'].forEach((offer) => bindIncomeMode(form, `[data-offer="${offer}"][data-key="income-mode"]`, `[data-offer="${offer}"][data-hours-wrap]`));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputError = validateNumbers(form, 'input[type="number"]');
      if (inputError) return setError(form, inputError);
      const a = scenarioFromOffer(form, 'a');
      const b = scenarioFromOffer(form, 'b');
      if (a.error || b.error) return setError(form, a.error || b.error);
      setError(form, '');
      const difference = a.scenario.remaining - b.scenario.remaining;
      const winner = difference > 0 ? 'Offer A' : difference < 0 ? 'Offer B' : 'Neither scenario';
      const comparison = difference === 0
        ? 'Based on the values entered, both scenarios leave the same estimated monthly cash.'
        : `Based on the information entered, ${winner} leaves approximately <strong>${money(Math.abs(difference))}</strong> more estimated monthly cash each month.`;
      const aBreakEven = Math.max(0, a.scenario.monthlyTakeHome - (a.scenario.debt + a.scenario.utilities + a.scenario.healthBenefits + a.scenario.transportation + a.scenario.otherExpenses));
      const bBreakEven = Math.max(0, b.scenario.monthlyTakeHome - (b.scenario.debt + b.scenario.utilities + b.scenario.healthBenefits + b.scenario.transportation + b.scenario.otherExpenses));
      setResult(form, `<h2>Monthly scenario comparison</h2><p class="result-lede">${comparison}</p><div class="result-grid">${scenarioCard('A', a)}${scenarioCard('B', b)}</div><div class="result-summary"><strong>Cash-flow break-even rent before a monthly deficit</strong><span>Offer A: ${money(aBreakEven)} · Offer B: ${money(bBreakEven)}</span></div><p class="result-note">This compares the costs and assumptions you entered. It does not decide which job to accept, price benefits, model local taxes, or guarantee a lease or employer outcome.</p>`, difference === 0 ? 'warning' : 'positive');
    });
  }

  function initFirstApartment() {
    const form = byId('first-apartment-form');
    if (!form) return;
    populateStates(form);
    bindIncomeMode(form, '[name="income-mode"]', '[data-hours-wrap]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputError = validateNumbers(form, 'input[type="number"]');
      if (inputError) return setError(form, inputError);
      const annualGross = calc.annualizeIncome(value(form, '[name="income"]'), form.querySelector('[name="income-mode"]').value, value(form, '[name="hours"]') || 40);
      if (!Number.isFinite(annualGross)) return setError(form, 'Enter a valid positive income and, for hourly pay, hours per week.');
      setError(form, '');
      const scenario = calc.evaluateScenario({
        annualGross,
        state: form.querySelector('[name="state"]').value,
        filingStatus: form.querySelector('[name="filing-status"]').value,
        rent: value(form, '[name="rent"]'),
        utilities: value(form, '[name="utilities"]'),
        debt: value(form, '[name="debt"]'),
        transportation: value(form, '[name="transportation"]'),
        otherExpenses: value(form, '[name="renters-insurance"]') + value(form, '[name="parking"]') + value(form, '[name="internet-phone"]') + value(form, '[name="groceries"]') + value(form, '[name="other-expenses"]'),
        monthlySavingsGoal: value(form, '[name="savings-goal"]')
      });
      const moveIn = ['security-deposit','application-fee','holding-fee','first-month-rent','moving-cost','furniture-cost','other-move-in'].reduce((sum, name) => sum + calc.nonNegative(value(form, `[name="${name}"]`)), 0);
      const availableCash = calc.nonNegative(value(form, '[name="cash-available"]'));
      const cashAfterMove = availableCash - moveIn;
      const position = calc.classifyMonthlyPosition(scenario.remaining, scenario.monthlyTakeHome);
      const rentCeiling = Math.max(0, scenario.monthlyTakeHome - scenario.utilities - scenario.debt - scenario.transportation - scenario.otherExpenses - scenario.monthlySavingsGoal);
      const moveMessage = cashAfterMove >= 0 ? 'The cash entered covers the listed move-in costs.' : 'The listed move-in costs exceed the cash entered.';
      setResult(form, `<h2>Your first-apartment planning checks</h2><div class="result-grid"><div class="result-grid-card"><h3>Move-in test</h3><dl><div><dt>Listed move-in cash</dt><dd>${money(moveIn)}</dd></div><div><dt>Cash available</dt><dd>${money(availableCash)}</dd></div><div><dt>Cash after move-in</dt><dd>${signedMoney(cashAfterMove)}</dd></div></dl><p class="result-note"><strong>${cashAfterMove >= 0 ? 'Covered:' : 'Shortfall:'}</strong> ${moveMessage}</p></div><div class="result-grid-card"><h3>Monthly affordability test</h3><dl><div><dt>Est. monthly take-home</dt><dd>${money(scenario.monthlyTakeHome)}</dd></div><div><dt>All-in housing cost</dt><dd>${money(scenario.monthlyHousing)}</dd></div><div><dt>Total monthly costs</dt><dd>${money(scenario.totalRecurring)}</dd></div><div><dt>Monthly cash remaining</dt><dd>${signedMoney(scenario.remaining)}</dd></div><div><dt>Planning rent ceiling</dt><dd>${money(rentCeiling)}</dd></div></dl><p class="result-note"><strong>${position.label}:</strong> ${position.message}</p></div></div><p class="result-note">The rent ceiling is the amount left for rent after the other recurring costs and savings goal you entered. It is a planning calculation, not a lease-approval amount or a recommendation for a particular apartment.</p>`, scenario.remaining < 0 || cashAfterMove < 0 ? 'warning' : 'positive');
    });
  }

  function initSalaryNeeded() {
    const form = byId('salary-needed-form');
    if (!form) return;
    populateStates(form);
    bindIncomeMode(form, '[name="income-display-mode"]', '[data-hours-wrap]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputError = validateNumbers(form, 'input[type="number"]');
      if (inputError) return setError(form, inputError);
      const rent = calc.nonNegative(value(form, '[name="rent"]'));
      if (rent <= 0) return setError(form, 'Enter a monthly rent greater than $0 to calculate a salary target.');
      const state = form.querySelector('[name="state"]').value;
      const filingStatus = form.querySelector('[name="filing-status"]').value;
      const utilities = calc.nonNegative(value(form, '[name="utilities"]'));
      const debt = calc.nonNegative(value(form, '[name="debt"]'));
      const otherExpenses = calc.nonNegative(value(form, '[name="other-expenses"]'));
      const savingsGoal = calc.nonNegative(value(form, '[name="savings-goal"]'));
      const housingShare = Math.min(0.60, Math.max(0.10, Number(form.querySelector('[name="housing-share"]').value || 30) / 100));
      const takeHomeTarget = rent + utilities + debt + otherExpenses + savingsGoal;
      const solved = calc.solveAnnualGrossForMonthlyTarget(takeHomeTarget, state, filingStatus);
      if (!solved.resolved || !solved.scenario || !Number.isFinite(solved.annualGross)) return setError(form, solved.message || 'This planning target could not be resolved within the supported range.');
      setError(form, '');
      const rentOnlyAnnual = Math.ceil(((rent / housingShare) * 12) / 100) * 100;
      const hours = Math.max(1, Math.min(168, value(form, '[name="hours"]') || 40));
      const hourly = solved.annualGross / (52 * hours);
      const s = solved.scenario;
      setResult(form, `<h2>Estimated pay needed for this budget</h2><div class="result-grid"><div class="result-grid-card"><h3>All-in personal-budget target</h3><dl><div><dt>Gross annual salary</dt><dd>${money(solved.annualGross)}</dd></div><div><dt>Gross monthly income</dt><dd>${money(solved.annualGross / 12)}</dd></div><div><dt>Est. take-home monthly target</dt><dd>${money(s.monthlyTakeHome)}</dd></div><div><dt>Equivalent hourly wage</dt><dd>${money(hourly)}/hr</dd></div></dl></div><div class="result-grid-card"><h3>What is included</h3><dl><div><dt>Rent</dt><dd>${money(rent)}</dd></div><div><dt>Utilities</dt><dd>${money(utilities)}</dd></div><div><dt>Debt</dt><dd>${money(debt)}</dd></div><div><dt>Other recurring costs</dt><dd>${money(otherExpenses)}</dd></div><div><dt>Savings/buffer goal</dt><dd>${money(savingsGoal)}</dd></div></dl></div></div><div class="result-summary"><strong>Rent-only planning benchmark</strong><span>${money(rentOnlyAnnual)} annual gross using your ${Math.round(housingShare * 100)}% gross-income reference. Your all-in target is higher because it includes the recurring costs and savings goal entered.</span></div><p class="result-note">This reverse estimate uses simplified 2026 federal, payroll, and state planning assumptions. It is not an employer income requirement, tax return, lease approval, or guarantee of affordability. Local taxes, benefits, credits, dependents, variable hours, and landlord policies can change the real result.</p>`, 'positive');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initJobOffer();
    initFirstApartment();
    initSalaryNeeded();
  });
})();
