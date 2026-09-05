/* ToolVerse financial decision tools — client-side only; no calculator values are sent to analytics. */
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const num = (id) => {
    const el = $(id); if (!el) return 0;
    const value = Number(el.value);
    return Number.isFinite(value) ? value : NaN;
  };
  const money = (v) => Number.isFinite(v) ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) : '—';
  const money2 = (v) => Number.isFinite(v) ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v) : '—';
  const pct = (v) => Number.isFinite(v) ? `${(v*100).toFixed(1)}%` : '—';
  const finiteNonNegative = (v, max=100000000) => Number.isFinite(v) && v >= 0 && v <= max;
  const showError = (id, message) => { const el=$(id); if (!el) return; el.textContent=message; el.hidden=!message; };
  const setText = (id, value) => { const el=$(id); if (el) el.textContent=value; };
  const setResult = (id, tone, hidden) => { const el=$(id); if (!el) return; el.className=`tool-result ${tone||''}`; el.hidden=hidden; };
  const safeLink = (value) => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function initCashToClose(){
    const form=$('cash-to-close-form'); if(!form) return;
    const calculate=()=>{
      const price=num('ctc-price'), downInput=num('ctc-down'), downMode=$('ctc-down-mode')?.value||'percent';
      const closingPct=num('ctc-closing-pct'), earnest=num('ctc-earnest'), moving=num('ctc-moving'), repairs=num('ctc-repairs'), reserve=num('ctc-reserve'), available=num('ctc-cash');
      const values=[price,downInput,closingPct,earnest,moving,repairs,reserve,available];
      if(values.some(v=>!finiteNonNegative(v)) || price<=0 || closingPct>20 || (downMode==='percent'&&downInput>100) || (downMode==='amount'&&downInput>price) || earnest>price){
        showError('ctc-error','Enter non-negative values, keep the down payment below the home price, and use a closing-cost estimate between 0% and 20%.'); setResult('ctc-result','',true); return;
      }
      const down=downMode==='percent'?price*downInput/100:downInput;
      const closing=price*closingPct/100;
      const standardNeeded=Math.max(0,down+closing+moving+repairs+reserve-earnest);
      const conservativeClosing=price*Math.min(0.20,(closingPct+1.5)/100);
      const conservativeNeeded=Math.max(0,down+conservativeClosing+(moving+repairs)*1.15+reserve*1.25-earnest);
      const remaining=available-standardNeeded;
      const shortfall=Math.max(0,reserve-remaining);
      const tone=remaining<0?'danger':shortfall>0?'warning':'positive';
      setResult('ctc-result',tone,false); showError('ctc-error','');
      setText('ctc-down-output',money(down)); setText('ctc-closing-output',money(closing)); setText('ctc-needed-output',money(standardNeeded)); setText('ctc-remaining-output',money(remaining)); setText('ctc-reserve-output',money(reserve)); setText('ctc-shortfall-output',shortfall?money(shortfall):'$0'); setText('ctc-conservative-output',money(conservativeNeeded));
      setText('ctc-summary',remaining<0?`The standard plan is short by ${money(Math.abs(remaining))} before the reserve target is met.`:shortfall?`The standard plan leaves ${money(remaining)} after purchase, below the reserve target by ${money(shortfall)}.`:`The standard plan leaves ${money(remaining)} after purchase and covers the reserve target.`);
    };
    form.addEventListener('submit',e=>{e.preventDefault();calculate();});
    form.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>showError('ctc-error','')));
  }

  function initDti(){
    const form=$('dti-form'); if(!form) return;
    const calculate=()=>{
      const income=num('dti-income'), housing=num('dti-housing'), cards=num('dti-cards'), auto=num('dti-auto'), student=num('dti-student'), personal=num('dti-personal'), support=num('dti-support'), other=num('dti-other'), proposed=num('dti-proposed');
      const values=[income,housing,cards,auto,student,personal,support,other,proposed];
      if(values.some(v=>!finiteNonNegative(v,1000000))||income<=0){showError('dti-error','Enter a positive gross monthly income and non-negative monthly payment amounts.');setResult('dti-result','',true);return;}
      const current=housing+cards+auto+student+personal+support+other;
      const after=current+proposed;
      const currentRatio=current/income, proposedRatio=after/income, housingRatio=housing/income, remaining=income-after;
      const tone=proposedRatio>0.43?'danger':proposedRatio>0.36?'warning':'positive';
      const range=proposedRatio>0.43?'High planning pressure':proposedRatio>0.36?'Moderate planning pressure':'Lower planning pressure';
      setResult('dti-result',tone,false);showError('dti-error','');
      setText('dti-current-debt',money(current));setText('dti-current-ratio',pct(currentRatio));setText('dti-proposed-ratio',pct(proposedRatio));setText('dti-housing-ratio',pct(housingRatio));setText('dti-remaining',money(remaining));setText('dti-range',range);
      setText('dti-summary',remaining<0?`The listed obligations exceed gross monthly income by ${money(Math.abs(remaining))}.`:`After the proposed payment, ${money(remaining)} remains before taxes and other unlisted costs.`);
    };
    form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  }

  function initPaycheck(){
    const form=$('paycheck-form'); if(!form||!window.ToolVerseCalculations) return;
    const periods={annual:1,monthly:12,biweekly:26,weekly:52};
    const calculate=()=>{
      const frequency=$('pc-frequency')?.value||'monthly', gross=num('pc-gross'), bonus=num('pc-bonus'), retirement=num('pc-retirement'), health=num('pc-health'), hsa=num('pc-hsa'), addFederal=num('pc-add-federal'), addState=num('pc-add-state'), state=$('pc-state')?.value||'CA', status=$('pc-status')?.value||'single';
      const values=[gross,bonus,retirement,health,hsa,addFederal,addState];
      if(values.some(v=>!finiteNonNegative(v,1000000))||gross<=0){showError('pc-error','Enter a positive gross pay amount and non-negative deduction or withholding amounts.');setResult('pc-result','',true);return;}
      const count=periods[frequency], annualGross=gross*count+bonus, pretaxPer=retirement+health+hsa, pretaxAnnual=pretaxPer*count, taxableGross=Math.max(0,annualGross-pretaxAnnual);
      const taxes=window.ToolVerseCalculations.estimateTax(taxableGross,status,state); const extraFederal=addFederal*count, extraState=addState*count; const annualTakeHome=Math.max(0,annualGross-pretaxAnnual-taxes.total-extraFederal-extraState); const perPay=annualTakeHome/count;
      const tone=perPay>0?'positive':'danger'; setResult('pc-result',tone,false);showError('pc-error','');
      setText('pc-gross-output',money2(gross));setText('pc-pretax-output',money2(pretaxPer));setText('pc-taxable-output',money(taxableGross));setText('pc-federal-output',money(taxes.federal+extraFederal));setText('pc-ss-output',money(taxes.social));setText('pc-medicare-output',money(taxes.medicare+taxes.additional));setText('pc-state-output',money(taxes.stateTax+extraState));setText('pc-takehome-output',money2(perPay));setText('pc-annual-output',money(annualTakeHome));setText('pc-monthly-output',money(annualTakeHome/12));
      setText('pc-summary',`On these ${frequency} assumptions, estimated take-home is ${money2(perPay)} per pay period, or about ${money(annualTakeHome/12)} per month.`);
    };
    form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  }
  document.addEventListener('DOMContentLoaded',()=>{initCashToClose();initDti();initPaycheck();});
})();
