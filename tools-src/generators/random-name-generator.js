/* Random Name Generator — crypto RNG over curated US name lists. No data leaves the page. */
(function () {
  'use strict';
  var output = document.getElementById('rna-output');
  if (!output) return;

  var setEl = document.getElementById('rna-set');
  var countEl = document.getElementById('rna-count');
  var errorEl = document.getElementById('rna-error');
  var tracked = false;

  var FEMALE = ('Mary Patricia Jennifer Linda Elizabeth Barbara Susan Jessica Sarah Karen Nancy Lisa Betty Margaret Sandra Ashley Kimberly Emily Michelle Amanda Melissa Deborah Stephanie Rebecca Sharon Laura Cynthia Kathleen Amy Angela Shirley Anna Brenda Pamela Emma Nicole Helen Samantha Katherine Christine Debra Rachel Carolyn Janet Ruth Maria Olivia Heather Helen Diane Julie Joyce Victoria Kelly Christina Lauren Joan Evelyn Judith Andrea Hannah Megan Cheryl Janice Kathryn Jacqueline Ann Martha Madison Teresa Gloria Sara Ann Janice Grace Judy Theresa Rose Beverly Denise Marilyn Amber Danielle Abigail Brittany Diana Natalie Sophia Alexis Lori Kayla Amelia Morgan Taylor Lauren Brittany Savannah Brooklyn Hannah Addison Aubrey Elizabeth Ella Mia Abigail Emily Harper Avery Sofia Scarlett Grace Chloe Victoria Riley Aria Lily Aubrey Zoe Penelope Lillian Addison Natalie Camila Hannah Layla Brooklyn Ellie Paisley Everly Anna Caroline Nova Emilia Stela Valentina Leah Maya Lucy Violet Eleanor Hazel Savannah Aurora Audrey Bella Nora Camila Skylar Isla Ella Grace Scarlett').split(' ').filter(function (v, i, a) { return a.indexOf(v) === i; });
  var MALE = ('James Robert John Michael David William Richard Joseph Thomas Donald Charles Daniel Matthew Anthony Mark Donald Steven Paul Andrew Joshua Kenneth Kevin Brian George Timothy Ronald Gary Jeffrey Edward Stephen Larry Justin Scott Frank Brandon Benjamin Samuel Gregory Alexander Patrick Jack Dennis Jerry Tyler Aaron Jose Nathan Adam Henry Douglas Zachary Kyle Noah Ethan Jeremy Walter Christian Keith Roger Terry Austin Sean Gerald Harold Dylan Jordan Bryan Billy Bruce Albert Willie Philip Alan Juan Albert Gabriel Logan Alan Juan Roy Wayne Ralph Roy Eugene Randy Vincent Russell Elijah Louis Bobby Philip Johnny Bradley Caleb Liam Lucas Mason Logan James Benjamin Lucas Henry Ethan Alexander Owen Daniel Carter Isaiah Jayden Luke Matthew Leo Grayson Levi Anthony John Caleb Hunter Christian Jonathan Ryan Nicholas Julian Wyatt Owen Thomas Jack Liam Noah Jackson Aiden Elijah Grayson Lucas Leo Jayden Gabriel Carter Julian Luke Anthony Isaac Dylan Luke Ryan Caleb Hunter Christian Jonathan Levi Caleb Oliver Elijah James Wilson').split(' ').filter(function (v, i, a) { return a.indexOf(v) === i; });
  var LAST = ('Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez Lopez Gonzalez Wilson Anderson Thomas Taylor Moore Jackson Martin Lee Perez Thompson White Harris Sanchez Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Torres Nguyen Hill Flores Green Adams Nelson Baker Hall Rivera Campbell Mitchell Carter Roberts Gomez Phillips Evans Turner Diaz Parker Cruz Edwards Collins Reyes Stewart Morris Morales Murphy Cook Rogers Gutierrez Ortiz Morgan Cooper Peterson Bailey Reed Kelly Howard Ramos Peterson James Kim Cox Ward Richardson Torres Peterson Gray Ramirez James Watson Brooks Kelly Sanders Price Barnes Ross Henderson Coleman Jenkins Perry Powell Long Patterson Hughes Flores Washington Butler Simmons Foster Gonzales Bryant Alexander Russell Griffin Diaz Hayes Myers Ford Marshall Owens Harrison Castro Ruiz Kennedy Wells Alvarez Castillo Jimenez Washington Patterson Washington Cole Montgomery Burns Ross Kelly Grant Hansen Spencer Walsh Griffin Hansen').split(' ').filter(function (v, i, a) { return a.indexOf(v) === i; });

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('random-name-generator', 'generators', 'tool_use');
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

  function generate() {
    var count = parseInt(countEl.value, 10);
    if (isNaN(count) || count < 1) { showError('Generate at least 1 name.'); return; }
    if (count > 50) { count = 50; countEl.value = '50'; }
    hideError();
    var firsts = setEl.value === 'female' ? FEMALE : setEl.value === 'male' ? MALE : FEMALE.concat(MALE);
    var out = [];
    for (var i = 0; i < count; i++) out.push(pick(firsts) + ' ' + pick(LAST));
    output.value = out.join('\n');
    trackUse();
  }

  document.getElementById('rna-gen').addEventListener('click', generate);
  document.getElementById('rna-copy').addEventListener('click', function () {
    if (!output.value) { showError('Generate some names first.'); return; }
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
