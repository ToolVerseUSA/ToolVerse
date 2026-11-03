/* Embed Calculator — builds its tool list at runtime from ToolVerse's own
   public search index (/tools/search-index.json), so it always lists every
   published tool. No hardcoded tool list. Snippet is generated locally. */
(function () {
  'use strict';
  var toolEl = document.getElementById('ec-tool');
  if (!toolEl) return; // not on this page — safe global include

  var SITE = 'https://toolverseusa.github.io/ToolVerse';
  var INDEX_URLS = ['../search-index.json', '/ToolVerse/tools/search-index.json'];

  var widthEl = document.getElementById('ec-width');
  var heightEl = document.getElementById('ec-height');
  var snippetEl = document.getElementById('ec-snippet');
  var errorEl = document.getElementById('ec-error');
  var statusEl = document.getElementById('ec-status');
  var previewWrap = document.getElementById('ec-preview-wrap');
  var previewFrame = document.getElementById('ec-preview');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('embed-calculator', 'developer', 'tool_use');
    }
  }

  function showError(msg, isHtml) {
    if (isHtml) errorEl.innerHTML = msg;
    else errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }
  function showStatus(msg) {
    statusEl.textContent = msg;
    statusEl.hidden = false;
  }
  function hideStatus() {
    statusEl.hidden = true;
    statusEl.textContent = '';
  }

  function toolLabel(entry) {
    return entry.title + ' — ' + entry.categoryLabel;
  }

  function buildSnippet() {
    var opt = toolEl.options[toolEl.selectedIndex];
    if (!opt || !opt.value) {
      snippetEl.value = '';
      return '';
    }
    var url = opt.value;
    var title = opt.textContent.split(' — ')[0];
    var width = widthEl.value;
    var height = heightEl.value;
    var snippet = '<iframe src="' + url + '" width="' + width + '" height="' + height +
      '" style="border:0" loading="lazy" title="' + title + ' — ToolVerse"></iframe>';
    snippetEl.value = snippet;
    return snippet;
  }

  function refresh() {
    hideError();
    buildSnippet();
  }

  function loadIndex(urls, i) {
    if (i >= urls.length) {
      toolEl.innerHTML = '';
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Tool list unavailable';
      toolEl.appendChild(opt);
      snippetEl.value = '';
      showError('Could not load the tool list. Browse all tools on the <a href="/ToolVerse/tools/">tools hub</a> instead.', true);
      return;
    }
    fetch(urls[i]).then(function (resp) {
      if (!resp.ok) throw new Error('search index request failed: ' + resp.status);
      return resp.json();
    }).then(function (entries) {
      if (!Array.isArray(entries) || entries.length === 0) throw new Error('search index is empty');
      entries.sort(function (a, b) {
        return String(a.title).localeCompare(String(b.title));
      });
      toolEl.innerHTML = '';
      entries.forEach(function (entry) {
        if (!entry.url) return;
        var opt = document.createElement('option');
        opt.value = SITE + entry.url.replace(/^\/ToolVerse/, '');
        opt.textContent = toolLabel(entry);
        toolEl.appendChild(opt);
      });
      // Default to the currency converter when present, else the first tool.
      for (var j = 0; j < toolEl.options.length; j++) {
        if (toolEl.options[j].value.indexOf('currency-converter') !== -1) {
          toolEl.selectedIndex = j;
          break;
        }
      }
      refresh();
    }).catch(function () {
      loadIndex(urls, i + 1);
    });
  }

  toolEl.addEventListener('change', refresh);
  widthEl.addEventListener('change', refresh);
  heightEl.addEventListener('change', refresh);

  document.getElementById('ec-copy').addEventListener('click', function () {
    var snippet = buildSnippet();
    if (!snippet) {
      showError('Pick a tool first — the tool list may still be loading.');
      return;
    }
    hideError();
    function done() {
      showStatus('Embed code copied to clipboard.');
      trackUse();
    }
    function failed() {
      showError('Copy failed in this browser — select the code and copy it manually.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(snippet).then(done, failed);
    } else {
      snippetEl.focus();
      snippetEl.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) {
        failed();
      }
    }
  });

  document.getElementById('ec-preview-btn').addEventListener('click', function () {
    var opt = toolEl.options[toolEl.selectedIndex];
    if (!opt || !opt.value) {
      showError('Pick a tool first — the tool list may still be loading.');
      return;
    }
    hideError();
    previewWrap.hidden = false;
    previewFrame.src = opt.value;
    previewFrame.style.height = heightEl.value + 'px';
    trackUse();
  });

  loadIndex(INDEX_URLS, 0);
})();
