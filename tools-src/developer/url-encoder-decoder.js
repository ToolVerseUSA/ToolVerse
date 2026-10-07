/* URL Encoder & Decoder — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('ue-input');
  if (!input) return;

  var output = document.getElementById('ue-output');
  var mode = document.getElementById('ue-mode');
  var errorEl = document.getElementById('ue-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('url-encoder-decoder', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function process() {
    var text = input.value;
    if (!text) { output.value = ''; hideError(); return; }
    try {
      var result;
      if (mode.value === 'component') result = encodeURIComponent(text);
      else if (mode.value === 'full') result = encodeURI(text);
      else result = decodeURIComponent(text.replace(/\+/g, ' '));
      output.value = result;
      hideError();
      trackUse();
    } catch (e) {
      output.value = '';
      showError('Could not ' + (mode.value === 'decode' ? 'decode' : 'encode') + ' that text: ' + e.message);
    }
  }

  document.getElementById('ue-run').addEventListener('click', process);
  document.getElementById('ue-clear').addEventListener('click', function () {
    input.value = ''; hideError(); process(); input.focus();
  });
  document.getElementById('ue-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — convert some text first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  input.addEventListener('input', process);
  mode.addEventListener('change', process);
  process();
})();
