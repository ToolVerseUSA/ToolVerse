/* Date Duration Calculator — calendar math, browser-local. */
(function () {
  'use strict';
  var form = document.getElementById('dd-form');
  if (!form) return;

  var tracked = false;
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('date-duration', 'datetime', 'tool_use');
    }
  }
  function showError(msg) {
    var e = document.getElementById('dd-error');
    e.textContent = msg; e.hidden = false;
  }
  function hideError() {
    var e = document.getElementById('dd-error');
    e.hidden = true; e.textContent = '';
  }
  function atMidnight(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();
    var sVal = document.getElementById('dd-start').value;
    var eVal = document.getElementById('dd-end').value;
    if (!sVal || !eVal) { showError('Pick both a start and an end date.'); return; }
    var start = atMidnight(new Date(sVal + 'T00:00:00'));
    var end = atMidnight(new Date(eVal + 'T00:00:00'));
    if (isNaN(start) || isNaN(end)) { showError('Those dates are not valid.'); return; }
    var flip = false;
    if (end < start) { var t = start; start = end; end = t; flip = true; }

    var years = end.getFullYear() - start.getFullYear();
    var months = end.getMonth() - start.getMonth();
    var days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) { years--; months += 12; }

    var totalDays = Math.round((end - start) / 86400000);
    document.getElementById('dd-years').textContent = years.toLocaleString('en-US');
    document.getElementById('dd-months').textContent = months.toLocaleString('en-US');
    document.getElementById('dd-days').textContent = days.toLocaleString('en-US');
    document.getElementById('dd-total-days').textContent = totalDays.toLocaleString('en-US');
    document.getElementById('dd-weeks').textContent =
      (Math.floor(totalDays / 7)).toLocaleString('en-US') + ' weeks' +
      (totalDays % 7 ? ' + ' + (totalDays % 7) + ' days' : '');
    document.getElementById('dd-hours').textContent = (totalDays * 24).toLocaleString('en-US');
    document.getElementById('dd-lede').textContent =
      (flip ? 'Note: dates were swapped — showing the absolute duration. ' : '') +
      'From ' + start.toLocaleDateString('en-US') + ' to ' + end.toLocaleDateString('en-US') + '.';
    var res = document.getElementById('dd-result');
    res.hidden = false;
    res.focus();
    trackUse();
  });
})();
