/* Random Word Generator — crypto RNG over a curated built-in word list. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('rw-output');
  if (!output) return;

  var countEl = document.getElementById('rw-count');
  var minEl = document.getElementById('rw-min');
  var maxEl = document.getElementById('rw-max');
  var errorEl = document.getElementById('rw-error');
  var tracked = false;

  var WORDS = ('apple river mountain ocean window garden bridge market pencil paper bottle camera forest desert island valley harbor meadow window mirror candle lantern basket blanket pillow meadow stream brook cliff canyon ridge summit meadow harbor anchor sailor compass journey voyage adventure mystery treasure secret whisper thunder lightning rainbow sunshine moonlight starlight dawn dusk twilight horizon meadow willow maple cedar oak birch aspen poplar juniper heather clover fern moss pebble boulder granite marble crystal amber ivory pearl ruby sapphire emerald topaz opal quartz jasper onyx agate coral garnet turquoise velvet satin silk linen cotton wool leather brass copper iron steel silver golden bronze happy gentle brave clever kind wise calm bold bright quiet swift rapid silent merry jolly vivid lucid serene honest humble proud noble loyal tender warm cool fresh sweet sour bitter salty spicy mild rich plain simple easy hard soft rough smooth sharp dull bright dim loud soft quick slow early late young old new ancient modern future past present moment hour minute second day week month year season spring summer autumn winter morning evening night today tomorrow yesterday people family friend neighbor teacher student doctor farmer baker singer painter writer reader leader helper worker driver hunter fisher sailor farmer garden kitchen bedroom window door table chair lamp clock watch phone book page story poem song dance music art color red blue green yellow purple orange pink brown black white gray gold silver happy sad angry afraid surprised excited tired hungry thirsty sleepy awake alive strong weak healthy sick rich poor free busy ready sure sorry glad kind mean nice bad good great small big large tiny huge tall short long wide narrow thick thin heavy light full empty hot cold warm cool dry wet clean dirty fast slow high low near far here there where when why how what who this that these those some any many much few little more most other another same different first last next only own just even also very too so as if when while because although since unless until before after above below between through during without within across behind beyond inside outside around among against toward upon about again further once twice always never often sometimes rarely seldom already still yet almost quite rather instead however therefore besides meanwhile finally first second third morning').split(' ').filter(function (v, i, a) { return a.indexOf(v) === i && v.length > 2; });

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-word-generator', 'generators', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function randBelow(n) {
    var limit = Math.floor(4294967296 / n) * n;
    var buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }

  function generate() {
    var count = parseInt(countEl.value, 10);
    var min = parseInt(minEl.value, 10) || 0;
    var max = parseInt(maxEl.value, 10) || 0;
    if (isNaN(count) || count < 1) { showError('Generate at least 1 word.'); return; }
    if (count > 50) { count = 50; countEl.value = '50'; }
    if (max > 0 && min > max) { showError('Minimum length cannot exceed maximum length.'); return; }
    var pool = WORDS.filter(function (w) { return w.length >= min && (max === 0 || w.length <= max); });
    if (!pool.length) { showError('No words in the list match that length range — widen it.'); return; }
    hideError();
    var out = [];
    for (var i = 0; i < count; i++) out.push(pool[randBelow(pool.length)]);
    output.value = out.join(', ');
    trackUse();
  }

  document.getElementById('rw-gen').addEventListener('click', generate);
  document.getElementById('rw-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some words first.'); return; }
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
