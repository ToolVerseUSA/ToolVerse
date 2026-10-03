/* SERP Preview — renders locally. No data leaves the page. */
(function () {
  'use strict';
  var titleEl = document.getElementById('sp-title');
  if (!titleEl) return;

  var urlEl = document.getElementById('sp-url');
  var descEl = document.getElementById('sp-desc');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('serp-preview', 'seo', 'tool_use');
    }
  }

  function cleanUrl(u) {
    u = (u || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return u || 'example.com';
  }

  function render() {
    var title = titleEl.value.trim() || 'Your page title';
    var desc = descEl.value.trim() || 'Your meta description will appear here.';
    document.getElementById('sp-prev-title').textContent = title;
    document.getElementById('sp-prev-url').textContent = cleanUrl(urlEl.value);
    document.getElementById('sp-prev-desc').textContent = desc;

    var tLen = titleEl.value.length;
    var dLen = descEl.value.length;
    document.getElementById('sp-title-count').textContent = tLen;
    document.getElementById('sp-desc-count').textContent = dLen;
    var tCheck = document.getElementById('sp-check-title');
    var dCheck = document.getElementById('sp-check-desc');
    tCheck.textContent = tLen === 0 ? 'Title: empty'
      : tLen <= 60 ? 'Title: good (' + tLen + '/60 chars)'
      : 'Title: too long (' + tLen + ' chars — may be truncated)';
    dCheck.textContent = dLen === 0 ? 'Description: empty'
      : dLen <= 160 ? 'Description: good (' + dLen + '/160 chars)'
      : 'Description: too long (' + dLen + ' chars — may be truncated)';
    if (tLen > 0 || dLen > 0) trackUse();
  }

  ['input', 'change'].forEach(function (ev) {
    titleEl.addEventListener(ev, render);
    urlEl.addEventListener(ev, render);
    descEl.addEventListener(ev, render);
  });
  render();
})();
