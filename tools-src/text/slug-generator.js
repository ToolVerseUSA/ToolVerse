/* Slug Generator — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('sg-input');
  if (!input) return;

  var output = document.getElementById('sg-output');
  var sep = document.getElementById('sg-sep');
  var count = document.getElementById('sg-count');
  var errorEl = document.getElementById('sg-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('slug-generator', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function slugify(text, separator) {
    var s = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.toLowerCase().replace(/&/g, ' and ');
    s = s.replace(/[^a-z0-9]+/g, separator);
    s = s.replace(new RegExp('^\\' + (separator === '-' ? '-' : '_') + '+|\\' + (separator === '-' ? '-' : '_') + '+$', 'g'), '');
    return s;
  }

  function process() {
    var slug = slugify(input.value, sep.value);
    output.value = slug;
    count.textContent = slug.length + ' characters';
    if (slug) trackUse();
  }

  document.getElementById('sg-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('sg-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — type a title first.'); return; }
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
  sep.addEventListener('change', process);
  process();
})();
