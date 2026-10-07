/* XML Formatter — browser-local, uses the strict DOM XML parser. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('xf-input');
  if (!input) return;

  var output = document.getElementById('xf-output');
  var indentSel = document.getElementById('xf-indent');
  var errorEl = document.getElementById('xf-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('xml-formatter', 'developer', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function formatNode(node, depth, indentStr) {
    var pad = indentStr.repeat(depth);
    if (node.nodeType === 3) { // text
      var t = node.nodeValue.trim();
      return t ? pad + t : '';
    }
    if (node.nodeType === 8) return pad + '<!--' + node.nodeValue + '-->'; // comment
    if (node.nodeType === 4) return pad + '<![CDATA[' + node.nodeValue + ']]>'; // CDATA
    if (node.nodeType !== 1) return '';
    var el = node;
    var attrs = '';
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      attrs += ' ' + a.name + '="' + a.value.replace(/"/g, '&quot;') + '"';
    }
    var children = Array.from(el.childNodes).filter(function (c) {
      return c.nodeType !== 3 || c.nodeValue.trim() !== '';
    });
    if (children.length === 0) return pad + '<' + el.tagName + attrs + '/>';
    if (children.length === 1 && children[0].nodeType === 3) {
      return pad + '<' + el.tagName + attrs + '>' + children[0].nodeValue.trim() + '</' + el.tagName + '>';
    }
    var inner = children.map(function (c) { return formatNode(c, depth + 1, indentStr); }).filter(Boolean).join('\n');
    return pad + '<' + el.tagName + attrs + '>\n' + inner + '\n' + pad + '</' + el.tagName + '>';
  }

  function run() {
    var text = input.value.trim();
    if (!text) { output.value = ''; hideError(); return; }
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var err = doc.querySelector('parsererror');
    if (err) {
      output.value = '';
      showError('Invalid XML: ' + err.textContent.trim().split('\n')[0]);
      return;
    }
    hideError();
    var indentStr = indentSel.value === 'tab' ? '\t' : ' '.repeat(parseInt(indentSel.value, 10));
    var decl = '';
    var m = text.match(/^\s*(<\?xml[\s\S]*?\?>)/);
    if (m) decl = m[1] + '\n';
    output.value = decl + formatNode(doc.documentElement, 0, indentStr);
    trackUse();
  }

  document.getElementById('xf-run').addEventListener('click', run);
  document.getElementById('xf-clear').addEventListener('click', function () {
    input.value = ''; hideError(); output.value = ''; input.focus();
  });
  document.getElementById('xf-copy').addEventListener('click', function () {
    if (!output.value) { showError('Nothing to copy yet — format some XML first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
})();
