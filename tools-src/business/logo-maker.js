/* Logo Maker — browser-local SVG logo. No data leaves the page. */
(function () {
  'use strict';
  var nameEl = document.getElementById('lg-name');
  if (!nameEl) return; // not on this page — safe global include
  var preview = document.getElementById('lg-preview');
  var errorEl = document.getElementById('lg-error');
  var tracked = false;

  var PALETTES = [
    { bg: '#1e3a5f', fg: '#ffffff', accent: '#f59e0b', name: 'Navy' },
    { bg: '#14532d', fg: '#ffffff', accent: '#a3e635', name: 'Forest' },
    { bg: '#111827', fg: '#ffffff', accent: '#22d3ee', name: 'Charcoal' },
    { bg: '#7f1d1d', fg: '#ffffff', accent: '#fbbf24', name: 'Crimson' },
    { bg: '#0f766e', fg: '#ffffff', accent: '#fde68a', name: 'Teal' },
    { bg: '#581c87', fg: '#ffffff', accent: '#f0abfc', name: 'Plum' }
  ];
  // Simple original SVG shapes, drawn in a 100x100 box.
  var ICONS = {
    star: '<path d="M50 6 L61 38 L95 38 L68 58 L78 92 L50 71 L22 92 L32 58 L5 38 L39 38 Z"/>',
    bolt: '<path d="M55 4 L18 56 L42 56 L38 96 L82 42 L56 42 Z"/>',
    leaf: '<path d="M84 8 C40 12 12 38 14 82 C52 84 78 56 84 8 Z"/><path d="M20 78 C34 58 52 40 74 26" fill="none" stroke-width="5"/>',
    shield: '<path d="M50 4 L86 16 V50 C86 74 70 88 50 96 C30 88 14 74 14 50 V16 Z"/><path d="M36 50 L46 60 L66 38" fill="none" stroke-width="6"/>',
    circle: '<circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="20" fill="#fff" opacity="0.35"/>',
    hexagon: '<path d="M50 4 L90 27 V73 L50 96 L10 73 V27 Z"/><circle cx="50" cy="50" r="18" fill="#fff" opacity="0.35"/>',
    home: '<path d="M8 52 L50 12 L92 52 V90 H62 V66 H38 V90 H8 Z"/>',
    briefcase: '<rect x="10" y="32" width="80" height="56" rx="6"/><path d="M36 32 V24 a8 8 0 0 1 8-8 h12 a8 8 0 0 1 8 8 v8" fill="none" stroke-width="7"/><path d="M10 58 h80" stroke-width="6"/>'
  };
  var W = 1200, H = 800;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('logo-maker', 'business', 'tool_use');
    }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function checked(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  function buildSvg() {
    var name = nameEl.value.trim() || 'Your Business';
    var taglineEl = document.getElementById('lg-tagline');
    var tagline = taglineEl ? taglineEl.value.trim() : '';
    var layout = checked('lg-layout') || 'stacked';
    var pal = PALETTES[parseInt(checked('lg-palette') || '0', 10)] || PALETTES[0];
    var iconKey = checked('lg-icon') || 'star';
    var icon = ICONS[iconKey] || ICONS.star;
    var iconFill = 'fill="' + pal.accent + '" stroke="' + pal.accent + '" stroke-linejoin="round" stroke-linecap="round"';
    var iconG = '<g ' + iconFill + '>' + icon + '</g>';
    var nameText = '<text x="600" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="bold" fill="' + pal.fg + '">' + esc(name) + '</text>';
    var tagText = tagline ? '<text x="600" y="630" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="' + pal.fg + '" opacity="0.85">' + esc(tagline) + '</text>' : '';
    var inner = '';
    if (layout === 'stacked') {
      inner = '<g transform="translate(480,110) scale(2.4)">' + iconG + '</g>' + nameText + tagText;
    } else if (layout === 'horizontal') {
      inner = '<g transform="translate(90,280) scale(2.4)">' + iconG + '</g>' +
        '<text x="380" y="420" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="bold" fill="' + pal.fg + '">' + esc(name) + '</text>' +
        (tagline ? '<text x="380" y="490" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="' + pal.fg + '" opacity="0.85">' + esc(tagline) + '</text>' : '');
    } else { // badge
      inner = '<circle cx="600" cy="330" r="230" fill="' + pal.accent + '" opacity="0.25"/>' +
        '<circle cx="600" cy="330" r="200" fill="none" stroke="' + pal.accent + '" stroke-width="8"/>' +
        '<g transform="translate(480,210) scale(2.4)">' + iconG + '</g>' +
        '<text x="600" y="640" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="bold" fill="' + pal.fg + '">' + esc(name) + '</text>' +
        (tagline ? '<text x="600" y="700" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="' + pal.fg + '" opacity="0.85">' + esc(tagline) + '</text>' : '');
    }
    return '<svg id="lg-svg" xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Logo preview for ' + esc(name) + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="' + pal.bg + '"/>' + inner + '</svg>';
  }

  function render() {
    preview.innerHTML = buildSvg();
    if (nameEl.value.trim()) trackUse();
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  nameEl.addEventListener('input', render);
  var tagEl = document.getElementById('lg-tagline');
  if (tagEl) tagEl.addEventListener('input', render);
  ['lg-layout', 'lg-palette', 'lg-icon'].forEach(function (n) {
    var radios = document.querySelectorAll('input[name="' + n + '"]');
    for (var i = 0; i < radios.length; i++) radios[i].addEventListener('change', render);
  });

  document.getElementById('lg-clear').addEventListener('click', function () {
    nameEl.value = '';
    if (tagEl) tagEl.value = '';
    var stacked = document.querySelector('input[name="lg-layout"][value="stacked"]');
    if (stacked) stacked.checked = true;
    var p0 = document.querySelector('input[name="lg-palette"][value="0"]');
    if (p0) p0.checked = true;
    var star = document.querySelector('input[name="lg-icon"][value="star"]');
    if (star) star.checked = true;
    hideError();
    render();
    nameEl.focus();
  });
  document.getElementById('lg-download-svg').addEventListener('click', function () {
    if (!nameEl.value.trim()) { showError('Add your business name first.'); return; }
    hideError();
    trackUse();
    var svg = buildSvg();
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'toolverse-logo.svg');
  });
  document.getElementById('lg-download-png').addEventListener('click', function () {
    if (!nameEl.value.trim()) { showError('Add your business name first.'); return; }
    hideError();
    trackUse();
    var svgText = buildSvg();
    var blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      if (canvas.toBlob) {
        canvas.toBlob(function (b) { if (b) downloadBlob(b, 'toolverse-logo.png'); else showError('PNG export failed in this browser.'); }, 'image/png');
      } else {
        showError('PNG export is not supported in this browser.');
      }
    };
    img.onerror = function () { URL.revokeObjectURL(url); showError('PNG export failed in this browser.'); };
    img.src = url;
  });
  render();
})();
