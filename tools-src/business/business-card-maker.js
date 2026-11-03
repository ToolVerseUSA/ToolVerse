/* Business Card Maker — browser-local card designer. No data leaves the page.
   PNG export draws the same card data on a 1050x600 canvas (3.5x2 in @ 300 DPI). */
(function () {
  'use strict';
  var nameEl = document.getElementById('bc-name');
  if (!nameEl) return; // not on this page — safe global include

  var titleEl = document.getElementById('bc-title');
  var companyEl = document.getElementById('bc-company');
  var phoneEl = document.getElementById('bc-phone');
  var emailEl = document.getElementById('bc-email');
  var websiteEl = document.getElementById('bc-website');
  var taglineEl = document.getElementById('bc-tagline');
  var errorEl = document.getElementById('bc-error');
  var frontEl = document.getElementById('bc-front');
  var backEl = document.getElementById('bc-back');
  var tracked = false;
  var color = '#1e3a5f';
  var layout = 'centered';

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('business-card-maker', 'business', 'tool_use');
    }
  }

  function val(el, fallback) {
    var v = el ? el.value.trim() : '';
    return v || fallback;
  }

  function initials(name) {
    var parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'YN';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function render() {
    var name = val(nameEl, 'Your Name');
    var contact = [val(phoneEl, ''), val(emailEl, ''), val(websiteEl, '')].filter(Boolean).join('  ·  ') || 'phone · email · website';

    setText('bc-p-name', name);
    setText('bc-p-title', val(titleEl, 'Your Job Title'));
    setText('bc-p-company', val(companyEl, 'Your Company'));
    setText('bc-p-contact', contact);
    setText('bc-p-mono', initials(name));
    setText('bc-p-tag', val(taglineEl, 'Your tagline goes here.'));
    setText('bc-p-web', val(websiteEl, 'yourwebsite.com'));

    var accentEl = document.getElementById('bc-front-accent');
    if (accentEl) accentEl.style.background = color;
    if (backEl) backEl.style.background = color;
    if (frontEl) {
      frontEl.classList.toggle('centered', layout === 'centered');
    }
    hideError();
    if (nameEl.value.trim()) trackUse();
  }

  // Fit text to a max width by shrinking the font size.
  function fitFont(ctx, text, maxWidth, startPx, weight, family) {
    var px = startPx;
    ctx.font = weight + ' ' + px + 'px ' + family;
    while (px > 14 && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = weight + ' ' + px + 'px ' + family;
    }
    return px;
  }

  function drawCard(side) {
    var W = 1050, H = 600;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var cx = W / 2;
    var left = 72;
    var centered = layout === 'centered';
    var name = val(nameEl, 'Your Name');

    if (side === 'back') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, 210, 78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, initials(name), 130, 64, '800', 'Arial, sans-serif');
      ctx.fillText(initials(name), cx, 212);
      ctx.font = 'italic 40px Georgia, serif';
      ctx.fillText(val(taglineEl, 'Your tagline goes here.'), cx, 350);
      ctx.font = '30px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(val(websiteEl, 'yourwebsite.com'), cx, 420);
      return canvas;
    }

    // Front
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = color;
    ctx.fillRect(centered ? cx - 90 : left, 96, 180, 10);
    ctx.fillStyle = '#111111';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = centered ? 'center' : 'left';
    var x = centered ? cx : left;
    var maxW = centered ? W - 144 : W - left - 72;
    var namePx = fitFont(ctx, name, maxW, 72, '800', 'Arial, sans-serif');
    ctx.fillText(name, x, 210);
    ctx.fillStyle = '#475569';
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(val(titleEl, 'Your Job Title'), x, 262);
    ctx.fillStyle = '#111111';
    fitFont(ctx, val(companyEl, 'Your Company'), maxW, 40, '700', 'Arial, sans-serif');
    ctx.fillText(val(companyEl, 'Your Company'), x, 330);
    ctx.fillStyle = '#334155';
    ctx.font = '30px Arial, sans-serif';
    var lines = [val(phoneEl, ''), val(emailEl, ''), val(websiteEl, '')].filter(Boolean);
    var y = 400;
    lines.forEach(function (line) { ctx.fillText(line, x, y); y += 44; });
    if (lines.length === 0) ctx.fillText('phone · email · website', x, 400);
    return canvas;
  }

  function download(side) {
    var canvas = drawCard(side);
    if (!canvas) { showError('Your browser could not render the card image.'); return; }
    trackUse();
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        if (!blob) { showError('Your browser could not create the PNG file.'); return; }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'business-card-' + side + '.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
      }, 'image/png');
    } else {
      var a2 = document.createElement('a');
      a2.href = canvas.toDataURL('image/png');
      a2.download = 'business-card-' + side + '.png';
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
    }
  }

  var fields = [nameEl, titleEl, companyEl, phoneEl, emailEl, websiteEl, taglineEl];
  fields.forEach(function (el) {
    if (el) el.addEventListener('input', render);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.bc-swatch'), function (btn) {
    btn.addEventListener('click', function () {
      color = btn.getAttribute('data-color') || color;
      Array.prototype.forEach.call(document.querySelectorAll('.bc-swatch'), function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      render();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="bc-layout"]'), function (radio) {
    radio.addEventListener('change', function () { layout = radio.value; render(); });
  });

  var dlFront = document.getElementById('bc-download-front');
  if (dlFront) dlFront.addEventListener('click', function () { download('front'); });
  var dlBack = document.getElementById('bc-download-back');
  if (dlBack) dlBack.addEventListener('click', function () { download('back'); });

  var clearBtn = document.getElementById('bc-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    fields.forEach(function (el) { if (el) el.value = ''; });
    color = '#1e3a5f';
    layout = 'centered';
    Array.prototype.forEach.call(document.querySelectorAll('.bc-swatch'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-color') === '#1e3a5f' ? 'true' : 'false');
    });
    var centeredRadio = document.querySelector('input[name="bc-layout"][value="centered"]');
    if (centeredRadio) centeredRadio.checked = true;
    hideError();
    render();
    nameEl.focus();
  });

  render();
})();
