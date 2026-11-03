/* Currency Converter — live rates from the free no-key Frankfurter API
   (ECB reference rates). Amounts never leave the browser; only the rate
   lookup contacts the API. If the lookup fails, last-known rates recorded
   2026-11-03 are used and clearly labelled as possibly outdated. */
(function () {
  'use strict';
  var form = document.getElementById('cc-form');
  if (!form) return; // not on this page — safe global include

  var CURRENCIES = [
    ['USD', 'US Dollar (USD)'], ['EUR', 'Euro (EUR)'], ['GBP', 'British Pound (GBP)'],
    ['JPY', 'Japanese Yen (JPY)'], ['INR', 'Indian Rupee (INR)'], ['PKR', 'Pakistani Rupee (PKR)'],
    ['CAD', 'Canadian Dollar (CAD)'], ['AUD', 'Australian Dollar (AUD)'], ['CHF', 'Swiss Franc (CHF)'],
    ['CNY', 'Chinese Yuan (CNY)'], ['AED', 'UAE Dirham (AED)'], ['SAR', 'Saudi Riyal (SAR)'],
    ['HKD', 'Hong Kong Dollar (HKD)'], ['SGD', 'Singapore Dollar (SGD)'], ['NZD', 'New Zealand Dollar (NZD)'],
    ['SEK', 'Swedish Krona (SEK)'], ['NOK', 'Norwegian Krone (NOK)'], ['DKK', 'Danish Krone (DKK)'],
    ['MXN', 'Mexican Peso (MXN)'], ['BRL', 'Brazilian Real (BRL)'], ['ZAR', 'South African Rand (ZAR)'],
    ['KRW', 'South Korean Won (KRW)'], ['TRY', 'Turkish Lira (TRY)'], ['THB', 'Thai Baht (THB)']
  ];

  // Last-known rates per 1 USD, recorded 2026-11-03. Frankfurter rates are
  // dated 2026-11-02; PKR/AED/SAR are not published by Frankfurter, so their
  // values here come from the open exchange-rate source on 2026-11-03.
  // NEVER presented as live — only used with the visible outdated warning.
  var FALLBACK_DATE = '2026-11-03';
  var FALLBACK_RATES = {
    USD: 1, EUR: 0.89158, GBP: 0.74519, JPY: 157.9, INR: 94.91, PKR: 276.692206,
    CAD: 1.3974, AUD: 1.4269, CHF: 0.81963, CNY: 6.6483, AED: 3.6725, SAR: 3.75,
    HKD: 7.8461, SGD: 1.2789, NZD: 1.7773, SEK: 9.7606, NOK: 9.2524, DKK: 6.6634,
    MXN: 18.7197, BRL: 5.4378, ZAR: 16.6386, KRW: 1342.9, TRY: 49.968, THB: 33.76
  };

  var API_URL = 'https://api.frankfurter.app/latest';

  var amountEl = document.getElementById('cc-amount');
  var fromEl = document.getElementById('cc-from');
  var toEl = document.getElementById('cc-to');
  var errorEl = document.getElementById('cc-error');
  var outdatedEl = document.getElementById('cc-outdated');
  var ledeEl = document.getElementById('cc-lede');
  var inputEchoEl = document.getElementById('cc-input-echo');
  var outputEl = document.getElementById('cc-output');
  var rateEl = document.getElementById('cc-rate');
  var inverseEl = document.getElementById('cc-inverse');
  var rateDateEl = document.getElementById('cc-rate-date');
  var fetchedEl = document.getElementById('cc-fetched');
  var statusEl = document.getElementById('cc-status');

  var liveRates = null; // { base, date, rates } from the last successful fetch
  var liveBase = null;
  var usingFallback = false;
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('currency-converter', 'calculators', 'tool_use');
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

  function fillSelect(el, selected) {
    CURRENCIES.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c[0];
      opt.textContent = c[1];
      if (c[0] === selected) opt.selected = true;
      el.appendChild(opt);
    });
  }

  function fmtMoney(value, code) {
    var decimals = Math.abs(value) >= 100 ? 2 : (Math.abs(value) >= 1 ? 2 : 4);
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' ' + code;
  }
  function fmtRate(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  function fallbackRate(from, to) {
    return FALLBACK_RATES[to] / FALLBACK_RATES[from];
  }

  function render(amount, from, to, rate, rateDate, fetchedLabel, live) {
    var result = amount * rate;
    ledeEl.textContent = fmtMoney(amount, from) + ' = ' + fmtMoney(result, to);
    inputEchoEl.textContent = fmtMoney(amount, from);
    outputEl.textContent = fmtMoney(result, to);
    rateEl.textContent = '1 ' + from + ' = ' + fmtRate(rate) + ' ' + to;
    inverseEl.textContent = '1 ' + to + ' = ' + fmtRate(1 / rate) + ' ' + from;
    rateDateEl.textContent = rateDate;
    fetchedEl.textContent = fetchedLabel;
    statusEl.textContent = live
      ? 'Live rate from Frankfurter (ECB reference rates). Rates as of ' + rateDate + ', fetched ' + fetchedLabel + '.'
      : 'Approximate rate — live rates unavailable. Last-known rates recorded ' + FALLBACK_DATE + '.';
    outdatedEl.hidden = live;
    if (amount > 0) trackUse();
  }

  function convert() {
    hideError();
    var amount = parseFloat(amountEl.value);
    if (isNaN(amount) || amount < 0) {
      showError('Enter a valid amount (0 or more).');
      return;
    }
    var from = fromEl.value;
    var to = toEl.value;
    if (from === to) {
      var sameLive = !usingFallback && !!liveRates;
      render(amount, from, to, 1, sameLive ? liveRates.date : FALLBACK_DATE,
        sameLive ? 'just now' : 'not fetched — fallback in use', sameLive);
      outdatedEl.hidden = true; // same-currency rate is exactly 1, never stale
      return;
    }
    var fetchedLabel = new Date().toLocaleString('en-US');
    if (liveRates && liveBase === from && typeof liveRates.rates[to] === 'number') {
      usingFallback = false;
      render(amount, from, to, liveRates.rates[to], liveRates.date, fetchedLabel, true);
      return;
    }
    // No live rate for this pair (API down, or currency outside Frankfurter
    // coverage such as PKR/AED/SAR) — fall back to last-known rates, labelled.
    usingFallback = true;
    render(amount, from, to, fallbackRate(from, to), FALLBACK_DATE, 'not fetched — fallback in use', false);
  }

  function fetchRates() {
    var from = fromEl.value;
    statusEl.textContent = 'Loading live rates…';
    var controller = null;
    var timeoutId = null;
    var url = API_URL + '?from=' + encodeURIComponent(from);
    var promise;
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(function () { controller.abort(); }, 8000);
      promise = fetch(url, { signal: controller.signal });
    } else {
      promise = fetch(url);
    }
    promise.then(function (resp) {
      if (!resp.ok) throw new Error('rates request failed: ' + resp.status);
      return resp.json();
    }).then(function (data) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!data || !data.rates) throw new Error('rates response had no rates');
      liveRates = data;
      liveBase = from;
      usingFallback = false;
      convert();
    }).catch(function () {
      if (timeoutId) clearTimeout(timeoutId);
      liveRates = null;
      liveBase = null;
      usingFallback = true;
      convert();
    });
  }

  fillSelect(fromEl, 'USD');
  fillSelect(toEl, 'EUR');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    convert();
  });
  amountEl.addEventListener('input', convert);
  fromEl.addEventListener('change', function () { liveRates = null; liveBase = null; fetchRates(); });
  toEl.addEventListener('change', convert);
  document.getElementById('cc-swap').addEventListener('click', function () {
    var tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    liveRates = null;
    liveBase = null;
    fetchRates();
  });

  fetchRates();
})();
