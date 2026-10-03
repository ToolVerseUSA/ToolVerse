/* Case Converter — pure string transforms, browser-local. */
(function () {
  'use strict';
  var input = document.getElementById('cc-input');
  if (!input) return;

  var output = document.getElementById('cc-output');
  var tracked = false;
  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('case-converter', 'text', 'tool_use');
    }
  }
  function showError(msg) {
    var e = document.getElementById('cc-error');
    e.textContent = msg; e.hidden = false;
  }
  function hideError() {
    var e = document.getElementById('cc-error');
    e.hidden = true; e.textContent = '';
  }

  var TRANSFORMS = {
    upper: function (s) { return s.toUpperCase(); },
    lower: function (s) { return s.toLowerCase(); },
    title: function (s) {
      return s.toLowerCase().replace(/(^|[\s\-–—(])(\S)/g, function (m, p1, p2) {
        return p1 + p2.toUpperCase();
      });
    },
    sentence: function (s) {
      return s.toLowerCase().replace(/(^\s*\S|[.!?…]\s*\S)/g, function (m) {
        return m.toUpperCase();
      });
    },
    alternating: function (s) {
      var out = '', up = false;
      for (var i = 0; i < s.length; i++) {
        var ch = s[i];
        if (/[a-zA-Z]/.test(ch)) { out += up ? ch.toUpperCase() : ch.toLowerCase(); up = !up; }
        else out += ch;
      }
      return out;
    }
  };

  document.querySelectorAll('[data-cc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hideError();
      var text = input.value;
      if (!text) { showError('Type or paste some text first.'); return; }
      output.textContent = TRANSFORMS[btn.getAttribute('data-cc')](text);
      trackUse();
    });
  });

  document.getElementById('cc-copy').addEventListener('click', function () {
    var t = output.textContent;
    if (!t) { showError('Convert some text first.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(hideError, function () { showError('Copy failed in this browser.'); });
    } else showError('Copy is not supported in this browser.');
  });
})();
