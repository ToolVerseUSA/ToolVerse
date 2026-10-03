/* JSON Formatter & Validator — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('jf-input');
  if (!input) return; // not on this page — safe global include

  var errorEl = document.getElementById('jf-error');
  var outputEl = document.getElementById('jf-output');
  var ledeEl = document.getElementById('jf-lede');
  var statusEl = document.getElementById('jf-status');
  var sizeEl = document.getElementById('jf-size');
  var typeEl = document.getElementById('jf-type');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('json-formatter', 'developer', 'tool_use');
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function byteSize(str) {
    if (window.TextEncoder) return new TextEncoder().encode(str).length;
    return unescape(encodeURIComponent(str)).length;
  }

  function describe(value) {
    if (Array.isArray(value)) return 'array[' + value.length + ']';
    if (value === null) return 'null';
    return typeof value;
  }

  function process(mode) {
    hideError();
    var raw = input.value;
    if (!raw.trim()) {
      showError('Paste some JSON first.');
      return;
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      statusEl.textContent = 'Invalid';
      sizeEl.textContent = '—';
      typeEl.textContent = '—';
      outputEl.textContent = '';
      ledeEl.textContent = 'This JSON is not valid.';
      showError('Invalid JSON: ' + e.message);
      return;
    }
    var out = mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
    outputEl.textContent = out;
    statusEl.textContent = 'Valid';
    sizeEl.textContent = byteSize(out).toLocaleString('en-US') + ' bytes';
    typeEl.textContent = describe(parsed);
    ledeEl.textContent = mode === 'minify'
      ? 'Minified JSON — smallest possible size.'
      : 'Pretty-printed JSON with 2-space indentation.';
    trackUse();
  }

  document.getElementById('jf-format').addEventListener('click', function () { process('format'); });
  document.getElementById('jf-minify').addEventListener('click', function () { process('minify'); });
  document.getElementById('jf-validate').addEventListener('click', function () {
    hideError();
    var raw = input.value;
    if (!raw.trim()) { showError('Paste some JSON first.'); return; }
    try {
      var parsed = JSON.parse(raw);
      statusEl.textContent = 'Valid';
      sizeEl.textContent = byteSize(raw).toLocaleString('en-US') + ' bytes';
      typeEl.textContent = describe(parsed);
      ledeEl.textContent = 'This JSON is valid.';
      outputEl.textContent = '';
      trackUse();
    } catch (e) {
      statusEl.textContent = 'Invalid';
      ledeEl.textContent = 'This JSON is not valid.';
      showError('Invalid JSON: ' + e.message);
    }
  });
  document.getElementById('jf-clear').addEventListener('click', function () {
    input.value = '';
    outputEl.textContent = '';
    hideError();
    statusEl.textContent = '—';
    sizeEl.textContent = '—';
    typeEl.textContent = '—';
    ledeEl.textContent = 'Your formatted or validated JSON will appear here.';
    input.focus();
  });
  document.getElementById('jf-copy').addEventListener('click', function () {
    var text = outputEl.textContent;
    if (!text) { showError('Nothing to copy yet.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(hideError, function () { showError('Copy failed in this browser.'); });
    } else {
      showError('Copy is not supported in this browser.');
    }
    trackUse();
  });
})();
