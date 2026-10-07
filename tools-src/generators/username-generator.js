/* Username Generator — crypto RNG over built-in word lists. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('un-output');
  if (!output) return;

  var styleEl = document.getElementById('un-style');
  var numbersEl = document.getElementById('un-numbers');
  var sepEl = document.getElementById('un-sep');
  var errorEl = document.getElementById('un-error');
  var tracked = false;

  var ADJ = ('swift bold bright clever quiet happy lucky cosmic solar lunar velvet crimson azure golden silver iron crystal rapid calm brave smart sharp smooth wild free pure noble regal vivid prime epic mega ultra turbo hyper neon retro cyber mystic solar stellar turbo atomic electric magnetic sonic optic prime zenith apex nova onyx ivory jade ruby topaz amber copper marble granite velvet satin silk cedar maple willow aspen birch harbor meadow summit prairie canyon lagoon glacier comet meteor orbit rocket falcon eagle raven wolf bear lion tiger panda koala otter badger falcon heron').split(' ');
  var NOUN = ('fox wolf bear lion tiger eagle raven hawk owl panda koala otter badger lynx moose bison falcon heron crane viper cobra puma jaguar harbor meadow summit canyon lagoon glacier comet rocket orbit planet star moon sun wave storm thunder cloud rain snow ember flame spark flare bolt arrow shield spear castle tower bridge gate forge anvil hammer quest realm crown jewel gem stone rock cliff dune reef bay cove port dock pier sail anchor compass map trail path ridge peak vale glen moor heath').split(' ');
  var FUNNY_ADJ = ('wobbly giggly sleepy grumpy sneaky clumsy dizzy fuzzy pickly noodly bananas cuddly bouncy jolly wonky zany loopy dopey snazzy peppy quirky nutty batty dotty witty cheeky sassy classy trashy splashy').split(' ');
  var FUNNY_NOUN = ('pickle noodle muffin waffle pancake taco burrito potato tomato cabbage turnip donut pretzel biscuit cupcake meatball eggplant avocado banana mango kiwi walnut peanut cashew almond pickle llama alpaca platypus narwhal axolotl capybara wombat marmot').split(' ');

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('username-generator', 'generators', 'tool_use');
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
  function pick(arr) { return arr[randBelow(arr.length)]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function makeOne() {
    var style = styleEl.value;
    var sep = sepEl.value;
    var adj, noun;
    if (style === 'funny') { adj = pick(FUNNY_ADJ); noun = pick(FUNNY_NOUN); }
    else { adj = pick(ADJ); noun = pick(NOUN); }
    var name;
    if (sep) name = adj + sep + noun;
    else if (style === 'professional') name = cap(adj) + cap(noun);
    else name = adj + noun;
    var wantNumbers = numbersEl.checked && (style === 'gamer' ? randBelow(10) < 7 : randBelow(10) < 4);
    if (wantNumbers) name += String(randBelow(90) + 10);
    if (style === 'professional') name = name.replace(/[^A-Za-z0-9_.]/g, '');
    return name;
  }

  function generate() {
    hideError();
    var seen = new Set();
    var out = [];
    var guard = 0;
    while (out.length < 20 && guard < 400) {
      guard++;
      var u = makeOne();
      if (!seen.has(u)) { seen.add(u); out.push(u); }
    }
    output.value = out.join('\n');
    trackUse();
  }

  document.getElementById('un-gen').addEventListener('click', generate);
  document.getElementById('un-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some ideas first.'); return; }
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
