/* Word Counter — browser-local text analysis. No data leaves the page. */
(function () {
  'use strict';
  var input = document.getElementById('wc-input');
  if (!input) return; // not on this page — safe global include

  var wordsEl = document.getElementById('wc-words');
  var charsEl = document.getElementById('wc-chars');
  var charsNoSpaceEl = document.getElementById('wc-chars-nospace');
  var sentencesEl = document.getElementById('wc-sentences');
  var paragraphsEl = document.getElementById('wc-paragraphs');
  var readingEl = document.getElementById('wc-reading');
  var errorEl = document.getElementById('wc-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('word-counter', 'text', 'tool_use');
    }
  }

  function analyze(text) {
    var trimmed = text.trim();
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    var sentences = trimmed
      ? trimmed.split(/[.!?…]+/).map(function (s) { return s.trim(); }).filter(Boolean).length
      : 0;
    var paragraphs = trimmed
      ? trimmed.split(/\n\s*\n|\n/).map(function (s) { return s.trim(); }).filter(Boolean).length
      : 0;
    return {
      words: words,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, '').length,
      sentences: sentences,
      paragraphs: paragraphs,
      minutes: Math.ceil(words / 200)
    };
  }

  function render() {
    var r = analyze(input.value);
    wordsEl.textContent = r.words.toLocaleString('en-US');
    charsEl.textContent = r.chars.toLocaleString('en-US');
    charsNoSpaceEl.textContent = r.charsNoSpace.toLocaleString('en-US');
    sentencesEl.textContent = r.sentences.toLocaleString('en-US');
    paragraphsEl.textContent = r.paragraphs.toLocaleString('en-US');
    readingEl.textContent = r.words === 0 ? '< 1 min' : '~' + r.minutes + ' min';
    if (r.words > 0) trackUse();
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  document.getElementById('wc-clear').addEventListener('click', function () {
    input.value = '';
    hideError();
    render();
    input.focus();
  });

  document.getElementById('wc-copy').addEventListener('click', function () {
    var r = analyze(input.value);
    var summary = 'Words: ' + r.words + '\nCharacters: ' + r.chars +
      '\nCharacters (no spaces): ' + r.charsNoSpace + '\nSentences: ' + r.sentences +
      '\nParagraphs: ' + r.paragraphs;
    function done() { showError(''); hideError(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(done, function () { showError('Copy failed in this browser.'); });
    } else {
      input.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { showError('Copy failed in this browser.'); }
    }
    trackUse();
  });

  input.addEventListener('input', render);
  render();
})();
