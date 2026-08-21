(() => {
  const money = (value) => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).format(value);
  const num = (id) => Math.max(0, Number(document.getElementById(id)?.value || 0));
  const show = (id, html) => { const el = document.getElementById(id); if (el) { el.innerHTML = html; el.hidden = false; } };

  document.getElementById('rent-rule-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const annual = num('rent-rule-income');
    if (!annual) return show('rent-rule-result', '<strong>Enter an annual income to continue.</strong><span>This reference uses 30% of gross monthly income. Use the full ToolVerse calculator for estimated take-home pay, debt, and expenses.</span>');
    const monthly = annual / 12;
    const reference = monthly * 0.30;
    show('rent-rule-result', `<strong>${money(reference)} per month</strong><span>That is 30% of a gross monthly income of ${money(monthly)}. It is a reference point, not a guarantee of affordability. Compare it with your estimated take-home pay, debt, and other expenses in ToolVerse.</span>`);
  });

  document.getElementById('after-rent-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const takeHome = num('after-rent-takehome');
    const rent = num('after-rent-rent');
    const debt = num('after-rent-debt');
    const expenses = num('after-rent-expenses');
    if (!takeHome) return show('after-rent-result', '<strong>Enter estimated monthly take-home pay.</strong><span>If you do not know it, use the full ToolVerse calculator to generate an educational estimate from income, state, and filing status.</span>');
    const left = takeHome - rent - debt - expenses;
    const label = left >= 0 ? 'Estimated money left after entered costs' : 'Estimated monthly shortfall after entered costs';
    show('after-rent-result', `<strong>${money(Math.abs(left))}</strong><span>${label}. This tool uses the take-home amount you entered; it does not replace a pay stub, tax return, or lender decision.</span>`);
  });

  document.getElementById('takehome-rent-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const takeHome = num('ratio-takehome');
    const rent = num('ratio-rent');
    const debt = num('ratio-debt');
    if (!takeHome) return show('takehome-rent-result', '<strong>Enter estimated monthly take-home pay.</strong><span>The full ToolVerse calculator can create an educational take-home estimate from gross income, state, and filing status.</span>');
    const ratio = rent / takeHome * 100;
    const remaining = takeHome - rent - debt;
    show('takehome-rent-result', `<strong>${ratio.toFixed(1)}% of estimated take-home pay</strong><span>After the rent and debt amounts entered here, ${money(Math.abs(remaining))} ${remaining >= 0 ? 'would remain before other expenses' : 'would still need to be covered before other expenses'}. A ratio is context, not a guarantee.</span>`);
  });

  document.getElementById('state-guide-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const state = document.getElementById('guide-state')?.value || '';
    const destinations = {IL: 'illinois-cost-of-living.html', TX: 'texas-cost-of-living.html'};
    if (destinations[state]) window.location.href = destinations[state];
    else window.location.href = 'index.html';
  });

  document.getElementById('salary-guide-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const annual = num('salary-guide-income');
    if (!annual) return show('salary-guide-result', '<strong>Enter an annual salary to continue.</strong><span>This guide provides gross-income reference points. Use the full ToolVerse calculator for estimated take-home pay, debt, and expense planning.</span>');
    const monthly = annual / 12;
    const low = monthly * 0.25;
    const reference = monthly * 0.30;
    const high = monthly * 0.35;
    show('salary-guide-result', `<strong>${money(low)} to ${money(high)} per month</strong><span>That is a 25%–35% gross-monthly reference range; 30% is ${money(reference)}. It is not a personal recommendation. Test your state, filing status, debt, rent, and expenses in the full ToolVerse calculator.</span>`);
  });
})();
