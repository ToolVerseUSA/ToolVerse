/* Resume Builder — browser-local resume preview. No data leaves the page. */
(function () {
  'use strict';
  var nameEl = document.getElementById('rb-name');
  if (!nameEl) return; // not on this page — safe global include
  var preview = document.getElementById('rb-preview');
  var errorEl = document.getElementById('rb-error');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('resume-builder', 'business', 'tool_use');
    }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function render() {
    var name = val('rb-name') || 'Your Name';
    var title = val('rb-title');
    var contact = [val('rb-email'), val('rb-phone'), val('rb-city')].filter(Boolean).join('  ·  ');
    var summary = val('rb-summary');
    var degree = val('rb-degree');
    var school = val('rb-school');
    var year = val('rb-year');
    var skills = val('rb-skills').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var html = '<p class="rb-pv-name">' + esc(name) + '</p>';
    if (title) html += '<p class="rb-pv-title">' + esc(title) + '</p>';
    if (contact) html += '<p class="rb-pv-contact">' + esc(contact) + '</p>';
    if (summary) html += '<p class="rb-pv-sec">Summary</p><p>' + esc(summary) + '</p>';
    var jobs = '';
    for (var i = 1; i <= 3; i++) {
      var jt = val('rb-exp' + i + '-title');
      var co = val('rb-exp' + i + '-company');
      var dt = val('rb-exp' + i + '-dates');
      var b1 = val('rb-exp' + i + '-b1');
      var b2 = val('rb-exp' + i + '-b2');
      if (!jt && !co && !b1 && !b2) continue;
      jobs += '<div class="rb-pv-job">';
      if (jt || co) jobs += '<b>' + esc(jt || 'Job title') + '</b>' + (co ? ' — ' + esc(co) : '');
      if (dt) jobs += ' <span class="rb-pv-dates">' + esc(dt) + '</span>';
      var bullets = [b1, b2].filter(Boolean);
      if (bullets.length) jobs += '<ul>' + bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
      jobs += '</div>';
    }
    if (jobs) html += '<p class="rb-pv-sec">Work Experience</p>' + jobs;
    if (degree || school || year) {
      html += '<p class="rb-pv-sec">Education</p><p>' + esc([degree, school].filter(Boolean).join(', ')) + (year ? ' — ' + esc(year) : '') + '</p>';
    }
    if (skills.length) html += '<p class="rb-pv-sec">Skills</p><p>' + esc(skills.join(' · ')) + '</p>';
    preview.innerHTML = html;
    var tpl = document.querySelector('input[name="rb-template"]:checked');
    preview.className = 'rb-preview ' + (tpl && tpl.value === 'modern' ? 'tpl-modern' : 'tpl-classic');
    if (val('rb-name') || title || summary) trackUse();
  }

  var ids = ['rb-name', 'rb-title', 'rb-email', 'rb-phone', 'rb-city', 'rb-summary',
    'rb-degree', 'rb-school', 'rb-year', 'rb-skills'];
  for (var i = 1; i <= 3; i++) {
    ['title', 'company', 'dates', 'b1', 'b2'].forEach(function (f) { ids.push('rb-exp' + i + '-' + f); });
  }
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });
  var radios = document.querySelectorAll('input[name="rb-template"]');
  for (var r = 0; r < radios.length; r++) radios[r].addEventListener('change', render);

  document.getElementById('rb-clear').addEventListener('click', function () {
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    var classic = document.getElementById('rb-tpl-classic');
    if (classic) classic.checked = true;
    hideError();
    render();
    nameEl.focus();
  });
  document.getElementById('rb-print').addEventListener('click', function () {
    if (!val('rb-name')) { showError('Add at least your name before printing.'); return; }
    hideError();
    trackUse();
    window.print();
  });
  render();
})();
