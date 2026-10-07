/* Remove HTML Tags — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('rht-input');
  if (!input) return;

  var output = document.getElementById('rht-output');
  var stats = document.getElementById('rht-stats');
  var breaks = document.getElementById('rht-breaks');
  var entities = document.getElementById('rht-entities');
  var errorEl = document.getElementById('rht-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('remove-html-tags', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function strip(html) {
    var s = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
    if (breaks.checked) {
      s = s.replace(/<br\s*\/?>/gi, '\n');
      s = s.replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer|ul|ol|table|blockquote|pre)>/gi, '\n');
      s = s.replace(/<li[^>]*>/gi, '\n');
    }
    var text;
    if (entities.checked) {
      var doc = new DOMParser().parseFromString(s, 'text/html');
      text = doc.body ? doc.body.textContent || '' : s.replace(/<[^>]*>/g, '');
    } else {
      text = s.replace(/<[^>]*>/g, '');
    }
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }

  function process() {
    if (!input.value) {
      output.value = '';
      stats.textContent = 'Your extracted text will appear here.';
      return;
    }
    var result = strip(input.value);
    output.value = result;
    stats.textContent = result.length.toLocaleString('en-US') + ' characters of plain text extracted.';
    if (result) trackUse();
  }

  document.getElementById('rht-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('rht-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — add some HTML first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
    trackUse();
  });
  input.addEventListener('input', process);
  breaks.addEventListener('change', process);
  entities.addEventListener('change', process);
  process();
})();
