/* JSON to CSV — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('jc-input');
  if (!input) return;

  var output = document.getElementById('jc-output');
  var stats = document.getElementById('jc-stats');
  var errorEl = document.getElementById('jc-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('json-to-csv', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function cell(v) {
    if (v === null || v === undefined) return '';
    var s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function convert() {
    var text = input.value.trim();
    if (!text) { output.value = ''; stats.textContent = 'Your CSV will appear here.'; hideError(); return; }
    var data;
    try { data = JSON.parse(text); }
    catch (e) { output.value = ''; showError('Invalid JSON: ' + e.message); return; }
    var rows;
    if (Array.isArray(data)) rows = data;
    else if (data && typeof data === 'object') rows = [data];
    else { output.value = ''; showError('Expected a JSON array of objects (or a single object).'); return; }
    if (rows.length === 0) { output.value = ''; showError('The array is empty — nothing to convert.'); return; }
    var headers = [];
    var seen = new Set();
    rows.forEach(function (row) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        Object.keys(row).forEach(function (k) { if (!seen.has(k)) { seen.add(k); headers.push(k); } });
      }
    });
    if (headers.length === 0) { output.value = ''; showError('Rows must be objects with keys to build a table.'); return; }
    hideError();
    var lines = [headers.map(cell).join(',')];
    rows.forEach(function (row) {
      lines.push(headers.map(function (h) { return cell(row ? row[h] : undefined); }).join(','));
    });
    output.value = lines.join('\r\n');
    stats.textContent = rows.length + ' rows × ' + headers.length + ' columns converted.';
    trackUse();
  }

  document.getElementById('jc-run').addEventListener('click', convert);
  document.getElementById('jc-clear').addEventListener('click', function () {
    input.value = ''; convert(); input.focus();
  });
  document.getElementById('jc-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — convert some JSON first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  document.getElementById('jc-download').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to download yet — convert some JSON first.'); return; }
    hideError();
    var blob = new Blob([output.value], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'converted.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  });
})();
