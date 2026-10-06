/* ToolVerse tools hub — client-side search over tools/search-index.json.
 * Scalable to 1,000+ entries: the index stays a single small JSON file and
 * filtering is a plain in-memory scan (no dependencies).
 * Phase 4: results render as a compact card dropdown under the field.
 */
(function () {
  'use strict';
  var input = document.getElementById('tools-search-input');
  var results = document.getElementById('tools-search-results');
  if (!input || !results) return;

  var index = null;
  var loaded = false;
  var POPULAR = ['word-counter', 'json-formatter', 'image-compressor', 'password-generator', 'unit-converter', 'serp-preview'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  fetch('/ToolVerse/tools/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { index = data; loaded = true; })
    .catch(function () { index = []; loaded = true; });

  function card(t) {
    var badge = POPULAR.indexOf(t.id) !== -1 ? '<span class="tv-badge tv-badge-popular">Popular</span>' : '';
    return '<a class="tv-tool-card" href="' + esc(t.url) + '"><span class="tv-tool-card-main"><span class="tv-tool-card-name">' +
      esc(t.title) + '</span><span class="tv-tool-card-cat">' + esc(t.categoryLabel) + '</span></span>' + badge + '</a>';
  }

  function close() {
    results.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q || !loaded) { close(); return; }
    var hits = index.filter(function (t) {
      var hay = (t.title + ' ' + t.description + ' ' + t.categoryLabel + ' ' + (t.keywords || []).join(' ')).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }).slice(0, 8);
    if (hits.length === 0) {
      results.innerHTML = '<div class="tv-search-panel"><p class="tv-search-note">No tools match &ldquo;' + esc(q) + '&rdquo; yet. Try a category below.</p></div>';
    } else {
      results.innerHTML = '<div class="tv-search-panel">' + hits.map(card).join('') + '</div>';
    }
    input.setAttribute('aria-expanded', 'true');
  }

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { search(input.value); }, 120);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); input.blur(); }
  });
  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) close();
  });
})();
