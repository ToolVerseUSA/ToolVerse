/* World Clock — live ticking clocks via Intl.DateTimeFormat. Pure JS,
   no fetch, no data leaves the page. */
(function () {
  'use strict';
  var grid = document.getElementById('wc-grid');
  if (!grid) return; // not on this page — safe global include

  var CITIES = [
    ['new-york', 'New York', 'America/New_York'],
    ['los-angeles', 'Los Angeles', 'America/Los_Angeles'],
    ['toronto', 'Toronto', 'America/Toronto'],
    ['london', 'London', 'Europe/London'],
    ['paris', 'Paris', 'Europe/Paris'],
    ['berlin', 'Berlin', 'Europe/Berlin'],
    ['dubai', 'Dubai', 'Asia/Dubai'],
    ['karachi', 'Karachi', 'Asia/Karachi'],
    ['mumbai', 'Mumbai', 'Asia/Kolkata'],
    ['singapore', 'Singapore', 'Asia/Singapore'],
    ['tokyo', 'Tokyo', 'Asia/Tokyo'],
    ['sydney', 'Sydney', 'Australia/Sydney']
  ];

  var localLede = document.getElementById('wc-local-lede');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('world-clock', 'datetime', 'tool_use');
    }
  }

  // Build one card per city.
  CITIES.forEach(function (c) {
    var card = document.createElement('div');
    card.className = 'result-grid-card';
    var h = document.createElement('h3');
    h.textContent = c[1];
    var time = document.createElement('p');
    time.id = 'wc-time-' + c[0];
    time.className = 'result-lede';
    time.textContent = '--:--:--';
    var date = document.createElement('p');
    date.id = 'wc-date-' + c[0];
    date.textContent = '';
    var offset = document.createElement('p');
    offset.id = 'wc-offset-' + c[0];
    offset.textContent = '';
    card.appendChild(h);
    card.appendChild(time);
    card.appendChild(date);
    card.appendChild(offset);
    grid.appendChild(card);
  });

  function offsetLabel(now, tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'shortOffset', hour: 'numeric'
    }).formatToParts(now);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'timeZoneName') return parts[i].value;
    }
    return '';
  }

  function tick() {
    var now = new Date();
    CITIES.forEach(function (c) {
      var tz = c[2];
      var timeEl = document.getElementById('wc-time-' + c[0]);
      var dateEl = document.getElementById('wc-date-' + c[0]);
      var offsetEl = document.getElementById('wc-offset-' + c[0]);
      if (!timeEl || !dateEl || !offsetEl) return;
      timeEl.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);
      dateEl.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }).format(now);
      offsetEl.textContent = offsetLabel(now, tz);
    });
    if (localLede) {
      localLede.textContent = 'Your local time: ' + new Intl.DateTimeFormat('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);
    }
    trackUse();
  }

  tick();
  setInterval(tick, 1000);
})();
