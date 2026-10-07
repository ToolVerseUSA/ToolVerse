/* SQL Formatter — browser-local, token-based layout. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('sf-input');
  if (!input) return;

  var output = document.getElementById('sf-output');
  var errorEl = document.getElementById('sf-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('sql-formatter', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  var KEYWORDS = new Set(('SELECT FROM WHERE AND OR NOT NULL IS IN LIKE BETWEEN EXISTS CASE WHEN THEN ELSE END AS ON JOIN LEFT RIGHT INNER OUTER FULL CROSS UNION ALL INTERSECT EXCEPT GROUP BY ORDER LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP INDEX VIEW DISTINCT HAVING ASC DESC PRIMARY KEY FOREIGN REFERENCES DEFAULT CONSTRAINT WITH RECURSIVE WINDOW RETURNING TOP').split(' '));
  var NEWLINE_BEFORE = new Set(['FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'OFFSET', 'HAVING', 'SET', 'VALUES', 'UNION', 'INTERSECT', 'EXCEPT', 'WITH']);
  var JOIN_WORDS = new Set(['JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS']);

  function tokenize(sql) {
    var tokens = [];
    var re = /('(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`|\[[^\]]*\]|--[^\n]*|\/\*[\s\S]*?\*\/|\s+|[(),;]|[^\s(),;]+)/g;
    var m;
    while ((m = re.exec(sql)) !== null) {
      var t = m[0];
      if (/^\s+$/.test(t)) continue;
      tokens.push(t);
    }
    return tokens;
  }

  function isWord(t) { return /^[A-Za-z_][A-Za-z0-9_$]*$/.test(t); }

  function format(sql) {
    var tokens = tokenize(sql);
    var out = [];
    var i = 0;
    var depth = 0;
    function newline(indent) {
      out.push('\n' + '  '.repeat(indent));
    }
    function space() {
      var last = out.length ? out[out.length - 1] : '';
      if (last && !/\s$/.test(last) && !/\($/.test(last)) out.push(' ');
    }
    while (i < tokens.length) {
      var t = tokens[i];
      var up = isWord(t) ? t.toUpperCase() : t;
      var next = tokens[i + 1];
      var nextUp = next && isWord(next) ? next.toUpperCase() : '';

      if (t === '(') { out.push('('); depth++; i++; continue; }
      if (t === ')') { depth = Math.max(0, depth - 1); out.push(')'); i++; continue; }
      if (t === ',') { out.push(', '); i++; continue; }
      if (t === ';') { out.push(';\n'); i++; continue; }

      // two-word clauses: GROUP BY / ORDER BY
      if ((up === 'GROUP' || up === 'ORDER') && nextUp === 'BY') {
        if (out.length) newline(depth);
        out.push(up + ' BY');
        i += 2;
        continue;
      }
      // joins
      if (JOIN_WORDS.has(up)) {
        var joinPhrase = up;
        var j = i + 1;
        while (j < tokens.length && JOIN_WORDS.has((isWord(tokens[j]) ? tokens[j].toUpperCase() : ''))) {
          joinPhrase += ' ' + tokens[j].toUpperCase();
          j++;
        }
        if (joinPhrase.indexOf('JOIN') === -1 && !(tokens[j] && tokens[j].toUpperCase() === 'JOIN')) { /* not a join start */ }
        else {
          if (out.length) newline(depth);
          out.push(joinPhrase);
          i = j;
          continue;
        }
      }
      if (NEWLINE_BEFORE.has(up) && out.length) {
        newline(depth);
        out.push(up);
        i++;
        continue;
      }
      if ((up === 'AND' || up === 'OR') && out.length) {
        newline(depth + 1);
        out.push(up);
        i++;
        continue;
      }
      if (up === 'ON' && out.length) {
        out.push(' ON');
        i++;
        continue;
      }
      space();
      out.push(KEYWORDS.has(up) ? up : t);
      i++;
    }
    return out.join('').replace(/\n\s*\n/g, '\n').trim();
  }

  function run() {
    var text = input.value.trim();
    if (!text) { output.value = ''; hideError(); return; }
    hideError();
    output.value = format(text);
    trackUse();
  }

  document.getElementById('sf-run').addEventListener('click', run);
  document.getElementById('sf-clear').addEventListener('click', function () {
    input.value = ''; hideError(); output.value = ''; input.focus();
  });
  document.getElementById('sf-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — format some SQL first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
})();
