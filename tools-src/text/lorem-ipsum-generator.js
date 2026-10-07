/* Lorem Ipsum Generator — browser-local. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('li-output');
  if (!output) return;

  var countEl = document.getElementById('li-count');
  var unitEl = document.getElementById('li-unit');
  var startEl = document.getElementById('li-start');
  var errorEl = document.getElementById('li-error');
  var tracked = false;

  var BANK = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum perspiciatis unde omnis iste natus error voluptatem accusantium doloremque laudantium totam rem aperiam eaque ab illo inventore veritatis quasi architecto beatae vitae dicta explicabo nemo enim ipsam voluptatem quia voluptas aspernatur odit aut fugit consequuntur magni dolores eos ratione sequi nesciunt neque porro quisquam dolorem numquam eius modi tempora incidunt magnam quaerat').split(' ');
  var FIRST = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('lorem-ipsum-generator', 'text', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function word() { return BANK[Math.floor(Math.random() * BANK.length)]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function sentence() {
    var n = 6 + Math.floor(Math.random() * 9); // 6–14 words
    var words = [];
    for (var i = 0; i < n; i++) words.push(word());
    var text = words.join(' ');
    if (n > 9) text = text.replace(/ (\w+)$/, ', $1'); // light comma before final word on long sentences
    return cap(text) + '.';
  }
  function paragraph(first) {
    var n = 4 + Math.floor(Math.random() * 4); // 4–7 sentences
    var parts = [];
    for (var i = 0; i < n; i++) parts.push(i === 0 && first ? FIRST : sentence());
    return parts.join(' ');
  }

  function generate() {
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Enter an amount of at least 1.'); return; }
    var unit = unitEl.value;
    var max = unit === 'paragraphs' ? 50 : unit === 'sentences' ? 100 : 500;
    if (count > max) { count = max; countEl.value = String(max); }
    hideError();
    var start = startEl.checked;
    var result;
    if (unit === 'words') {
      var words = [];
      if (start) words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
      while (words.length < count) words.push(word());
      result = words.slice(0, count).join(' ');
    } else if (unit === 'sentences') {
      var s = [];
      for (var i = 0; i < count; i++) s.push(i === 0 && start ? FIRST : sentence());
      result = s.join(' ');
    } else {
      var ps = [];
      for (var j = 0; j < count; j++) ps.push(paragraph(j === 0 && start));
      result = ps.join('\n\n');
    }
    output.value = result;
    trackUse();
  }

  document.getElementById('li-gen').addEventListener('click', generate);
  document.getElementById('li-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some text first.'); return; }
    hideError();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {}, function () { showError('Copy failed in this browser.'); });
    } else {
      output.select();
      try { document.execCommand('copy'); } catch (e) { showError('Copy failed in this browser.'); }
    }
  });
  generate();
})();
