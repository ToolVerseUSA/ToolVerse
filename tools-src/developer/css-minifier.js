/* CSS Minifier & Beautifier — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('cm-input');
  if (!input) return;

  var output = document.getElementById('cm-output');
  var stats = document.getElementById('cm-stats');
  var mode = document.getElementById('cm-mode');
  var errorEl = document.getElementById('cm-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('css-minifier', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function protectStrings(css, fn) {
    var store = [];
    var masked = css.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, function (m) {
      store.push(m);
      return '\u0000' + (store.length - 1) + '\u0000';
    });
    var result = fn(masked);
    return result.replace(/\u0000(\d+)\u0000/g, function (_, i) { return store[Number(i)]; });
  }

  function minify(css) {
    return protectStrings(css, function (s) {
      return s
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .replace(/^\s+|\s+$/g, '');
    });
  }

  function beautify(css) {
    return protectStrings(css, function (s) {
      var noComments = s;
      var out = '';
      var depth = 0;
      var buf = '';
      function flushDecl() {
        var d = buf.trim().replace(/\s+/g, ' ');
        buf = '';
        if (d) {
          var ci = d.indexOf(':');
          if (ci > 0 && depth > 0) d = d.slice(0, ci).trim() + ': ' + d.slice(ci + 1).trim();
          out += '  '.repeat(depth) + d + ';\n';
        }
      }
      for (var i = 0; i < noComments.length; i++) {
        var ch = noComments[i];
        if (ch === '{') {
          var selector = buf.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ');
          buf = '';
          out += '  '.repeat(depth) + selector + ' {\n';
          depth++;
        } else if (ch === '}') {
          flushDecl();
          depth = Math.max(0, depth - 1);
          out += '  '.repeat(depth) + '}\n';
        } else if (ch === ';') {
          flushDecl();
        } else {
          buf += ch;
        }
      }
      flushDecl();
      return out.trim();
    });
  }

  function run() {
    var text = input.value;
    if (!text.trim()) {
      output.value = '';
      stats.textContent = 'Your processed CSS will appear here.';
      hideError();
      return;
    }
    hideError();
    var result = mode.value === 'minify' ? minify(text) : beautify(text);
    output.value = result;
    var before = text.length, after = result.length;
    if (mode.value === 'minify') {
      var pct = before ? Math.round((1 - after / before) * 100) : 0;
      stats.textContent = before.toLocaleString('en-US') + ' → ' + after.toLocaleString('en-US') + ' characters (' + pct + '% smaller).';
    } else {
      stats.textContent = before.toLocaleString('en-US') + ' → ' + after.toLocaleString('en-US') + ' characters, formatted with 2-space indentation.';
    }
    trackUse();
  }

  document.getElementById('cm-run').addEventListener('click', run);
  document.getElementById('cm-clear').addEventListener('click', function () {
    input.value = ''; run(); input.focus();
  });
  document.getElementById('cm-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — process some CSS first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
})();
