/* ToolVerse tools hub — client-side search over tools/search-index.json.
 * Scalable to 1,000+ entries: the index stays a single small JSON file and
 * filtering is a plain in-memory scan (no dependencies).
 */
(function () {
  'use strict';
  var input = document.getElementById('tools-search-input');
  var results = document.getElementById('tools-search-results');
  if (!input || !results) return;

  var index = null;
  var loaded = false;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  fetch('/ToolVerse/tools/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { index = data; loaded = true; })
    .catch(function () { index = []; loaded = true; });

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q || !loaded) {
      results.innerHTML = '';
      return;
    }
    var hits = index.filter(function (t) {
      var hay = (t.title + ' ' + t.description + ' ' + t.categoryLabel + ' ' + (t.keywords || []).join(' ')).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }).slice(0, 20);
    if (hits.length === 0) {
      results.innerHTML = '<p class="result-note">No tools match "' + esc(q) + '" yet.</p>';
      return;
    }
    results.innerHTML = '<ul class="link-list">' + hits.map(function (t) {
      return '<li><a href="' + esc(t.url) + '">' + esc(t.title) + '</a> <span style="color:#8ea1bb;font-size:13px">— ' + esc(t.categoryLabel) + '</span></li>';
    }).join('') + '</ul>';
  }

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { search(input.value); }, 150);
  });
})();
