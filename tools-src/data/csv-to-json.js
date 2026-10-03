/* CSV to JSON — native parser, browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('cj-input');
  if (!input) return;

  var tracked = false;
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('csv-to-json', 'data', 'tool_use');
    }
  }
  function showError(msg) {
    var e = document.getElementById('cj-error');
    e.textContent = msg; e.hidden = false;
  }
  function hideError() {
    var e = document.getElementById('cj-error');
    e.hidden = true; e.textContent = '';
  }

  function parseCsv(text, delim) {
    var rows = [], row = [], field = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        row.push(field); field = '';
      } else if (ch === '\r') {
        continue;
      } else if (ch === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
    row.push(field); rows.push(row);
    return rows.filter(function (r) {
      return r.length > 1 || (r.length === 1 && r[0].trim() !== '');
    });
  }

  document.getElementById('cj-convert').addEventListener('click', function () {
    hideError();
    var raw = input.value;
    if (!raw.trim()) { showError('Paste some CSV data first.'); return; }
    var delim = document.getElementById('cj-delim').value;
    var useHeader = document.getElementById('cj-header').checked;
    var rows = parseCsv(raw, delim);
    if (rows.length === 0) { showError('No rows found.'); return; }
    var headers, dataRows;
    if (useHeader) {
      headers = rows[0].map(function (h, i) { return h.trim() === '' ? 'field' + (i + 1) : h.trim(); });
      dataRows = rows.slice(1);
    } else {
      var width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
      headers = [];
      for (var i = 0; i < width; i++) headers.push('field' + (i + 1));
      dataRows = rows;
    }
    var out = dataRows.map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = r[i] !== undefined ? r[i] : ''; });
      return obj;
    });
    var json = JSON.stringify(out, null, 2);
    document.getElementById('cj-output').textContent = json;
    document.getElementById('cj-lede').textContent =
      out.length + ' row(s) converted to JSON.';
    var dl = document.getElementById('cj-download');
    if (dl.href && dl.href.indexOf('blob:') === 0) URL.revokeObjectURL(dl.href);
    dl.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    trackUse();
  });

  document.getElementById('cj-clear').addEventListener('click', function () {
    input.value = '';
    document.getElementById('cj-output').textContent = '';
    document.getElementById('cj-lede').textContent = 'Converted JSON will appear here.';
    hideError();
    input.focus();
  });

  document.getElementById('cj-copy').addEventListener('click', function () {
    var t = document.getElementById('cj-output').textContent;
    if (!t) { showError('Nothing to copy yet.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(hideError, function () { showError('Copy failed in this browser.'); });
    } else showError('Copy is not supported in this browser.');
  });
})();
