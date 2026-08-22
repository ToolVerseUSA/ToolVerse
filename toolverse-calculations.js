/* ToolVerse shared finance planning engine — 2026-planning-v1
   Educational estimates only. This module intentionally performs all calculations in-browser. */
(function () {
  'use strict';

  const METHOD_VERSION = '2026-planning-v1';
  const LAST_REVIEWED = '2026-08-22';
  const MAX_MONEY = 1000000;
  const MAX_ANNUAL_GROSS = 10000000;

  const stateNames = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
  };

  // Planning estimates, not state tax liabilities. Zero values reflect states without a broad individual income tax.
  const stateRates = {AL:.05,AK:0,AZ:.025,AR:.044,CA:.093,CO:.044,CT:.0699,DE:.066,DC:.085,FL:0,GA:.055,HI:.08,ID:.058,IL:.0495,IN:.03,IA:.057,KS:.057,KY:.04,LA:.0425,ME:.0715,MD:.0575,MA:.05,MI:.0425,MN:.079,MS:.05,MO:.048,MT:.0675,NE:.055,NV:0,NH:0,NJ:.0637,NM:.059,NY:.0685,NC:.0425,ND:.02,OH:.04,OK:.0475,OR:.08,PA:.0307,RI:.0599,SC:.07,SD:0,TN:0,TX:0,UT:.0465,VT:.066,VA:.0575,WA:0,WV:.055,WI:.0765,WY:0};
  const brackets = {
    single:[[12400,.10],[50400,.12],[105700,.22],[197700,.24],[252700,.32],[640600,.35],[Infinity,.37]],
    mfj:[[24800,.10],[100800,.12],[211400,.22],[395400,.24],[505400,.32],[768700,.35],[Infinity,.37]],
    hoh:[[17700,.10],[67450,.12],[105700,.22],[197750,.24],[252700,.32],[640600,.35],[Infinity,.37]]
  };
  const deductions = {single:16100,mfj:32200,hoh:24150};

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function nonNegative(value, limit = MAX_MONEY) {
    return Math.min(limit, Math.max(0, number(value, 0)));
  }

  function validMoney(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_MONEY;
  }

  function federalTax(gross, status) {
    const annualGross = nonNegative(gross, MAX_ANNUAL_GROSS);
    const filing = brackets[status] ? status : 'single';
    const taxable = Math.max(0, annualGross - deductions[filing]);
    let tax = 0;
    let lower = 0;
    for (const [upper, rate] of brackets[filing]) {
      const slice = Math.max(0, Math.min(taxable, upper) - lower);
      tax += slice * rate;
      lower = upper;
      if (taxable <= upper) break;
    }
    return tax;
  }

  function estimateTax(annualGross, filingStatus, state) {
    const gross = nonNegative(annualGross, MAX_ANNUAL_GROSS);
    const status = brackets[filingStatus] ? filingStatus : 'single';
    const federal = federalTax(gross, status);
    const social = Math.min(gross, 184500) * 0.062;
    const medicare = gross * 0.0145;
    const additional = Math.max(0, gross - (status === 'mfj' ? 250000 : 200000)) * 0.009;
    const stateTax = gross * (stateRates[state] || 0);
    const total = federal + social + medicare + additional + stateTax;
    return {federal, social, medicare, additional, stateTax, total};
  }

  function annualizeIncome(amount, mode, hoursPerWeek) {
    const income = number(amount, NaN);
    const hours = number(hoursPerWeek, 40);
    if (!Number.isFinite(income) || income <= 0 || income > MAX_ANNUAL_GROSS) return NaN;
    if (mode === 'monthly') return income * 12;
    if (mode === 'biweekly') return income * 26;
    if (mode === 'weekly') return income * 52;
    if (mode === 'hourly') {
      if (!Number.isFinite(hours) || hours <= 0 || hours > 168) return NaN;
      return income * hours * 52;
    }
    return income;
  }

  function evaluateScenario(input) {
    const annualGross = nonNegative(input.annualGross, MAX_ANNUAL_GROSS);
    const state = stateNames[input.state] ? input.state : 'CA';
    const filingStatus = brackets[input.filingStatus] ? input.filingStatus : 'single';
    const rent = nonNegative(input.rent);
    const debt = nonNegative(input.debt);
    const utilities = nonNegative(input.utilities);
    const healthBenefits = nonNegative(input.healthBenefits);
    const transportation = nonNegative(input.transportation);
    const otherExpenses = nonNegative(input.otherExpenses);
    const monthlySavingsGoal = nonNegative(input.monthlySavingsGoal);
    const tax = estimateTax(annualGross, filingStatus, state);
    const annualTakeHome = Math.max(0, annualGross - tax.total);
    const monthlyTakeHome = annualTakeHome / 12;
    const monthlyHousing = rent + utilities;
    const totalRecurring = rent + debt + utilities + healthBenefits + transportation + otherExpenses + monthlySavingsGoal;
    const remaining = monthlyTakeHome - totalRecurring;
    const housingRatio = rent / Math.max(monthlyTakeHome, 1);
    const allInHousingRatio = monthlyHousing / Math.max(monthlyTakeHome, 1);
    const fixedCostPressure = (rent + debt + utilities + healthBenefits + transportation) / Math.max(monthlyTakeHome, 1);
    const totalExpenseRatio = totalRecurring / Math.max(monthlyTakeHome, 1);
    return {
      methodVersion: METHOD_VERSION,
      lastReviewed: LAST_REVIEWED,
      annualGross,
      state,
      filingStatus,
      rent,
      debt,
      utilities,
      healthBenefits,
      transportation,
      otherExpenses,
      monthlySavingsGoal,
      tax,
      annualTakeHome,
      monthlyGross: annualGross / 12,
      monthlyTakeHome,
      monthlyHousing,
      totalRecurring,
      remaining,
      housingRatio,
      allInHousingRatio,
      fixedCostPressure,
      totalExpenseRatio
    };
  }

  function solveAnnualGrossForMonthlyTarget(targetMonthlyTakeHome, state, filingStatus) {
    const target = nonNegative(targetMonthlyTakeHome, MAX_MONEY);
    if (target === 0) {
      return {resolved:true, annualGross:0, scenario:evaluateScenario({annualGross:0, state, filingStatus}), iterations:0};
    }

    let lower = 0;
    let upper = Math.max(60000, target * 18);
    let upperScenario = evaluateScenario({annualGross:upper, state, filingStatus});
    while (upperScenario.monthlyTakeHome < target && upper < MAX_ANNUAL_GROSS) {
      upper = Math.min(MAX_ANNUAL_GROSS, upper * 2);
      upperScenario = evaluateScenario({annualGross:upper, state, filingStatus});
    }
    if (upperScenario.monthlyTakeHome < target) {
      return {resolved:false, annualGross:null, scenario:null, iterations:0, message:'The requested monthly target is outside this planning tool’s supported range.'};
    }

    let scenario = upperScenario;
    let iterations = 0;
    while (iterations < 80 && upper - lower > 1) {
      const middle = (lower + upper) / 2;
      scenario = evaluateScenario({annualGross:middle, state, filingStatus});
      if (scenario.monthlyTakeHome >= target) upper = middle;
      else lower = middle;
      iterations += 1;
    }
    const annualGross = Math.ceil(upper / 100) * 100;
    return {resolved:true, annualGross, scenario:evaluateScenario({annualGross, state, filingStatus}), iterations};
  }

  function classifyMonthlyPosition(remaining, takeHome) {
    if (remaining < 0) return {label:'Deficit', tone:'danger', message:'The entered monthly costs exceed this estimated take-home amount.'};
    if (remaining < Math.max(100, takeHome * 0.10)) return {label:'Tight', tone:'warning', message:'The plan leaves limited monthly room after the costs entered.'};
    return {label:'More room', tone:'positive', message:'The plan leaves monthly room after the costs entered.'};
  }

  window.ToolVerseCalculations = Object.freeze({
    METHOD_VERSION,
    LAST_REVIEWED,
    MAX_MONEY,
    MAX_ANNUAL_GROSS,
    stateNames,
    stateRates,
    validMoney,
    nonNegative,
    annualizeIncome,
    estimateTax,
    evaluateScenario,
    solveAnnualGrossForMonthlyTarget,
    classifyMonthlyPosition
  });
})();
