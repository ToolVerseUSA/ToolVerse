/* Image Compressor — canvas-based, browser-local. No data leaves the page. */
(function () {
  'use strict';
  var fileInput = document.getElementById('ic-file');
  if (!fileInput) return;

  var qualityEl = document.getElementById('ic-quality');
  var qualityLabel = document.getElementById('ic-quality-label');
  var maxWidthEl = document.getElementById('ic-maxwidth');
  var errorEl = document.getElementById('ic-error');
  var resultEl = document.getElementById('ic-result');
  var downloadEl = document.getElementById('ic-download');
  var tracked = false;

  function trackUse() {
    if (!tracked && window.ToolVerseTools && typeof window.ToolVerseTools.track === 'function') {
      tracked = true;
      window.ToolVerseTools.track('image-compressor', 'image', 'tool_use');
    }
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  qualityEl.addEventListener('input', function () {
    qualityLabel.textContent = qualityEl.value;
  });

  document.getElementById('ic-compress').addEventListener('click', function () {
    hideError();
    var file = fileInput.files && fileInput.files[0];
    if (!file) { showError('Choose an image file first.'); return; }
    if (!/^image\//.test(file.type)) { showError('That file is not an image.'); return; }

    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        try {
          var maxW = Math.max(0, parseInt(maxWidthEl.value, 10) || 0);
          var scale = 1;
          if (maxW > 0 && img.naturalWidth > maxW) scale = maxW / img.naturalWidth;
          var w = Math.max(1, Math.round(img.naturalWidth * scale));
          var h = Math.max(1, Math.round(img.naturalHeight * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          var quality = Math.min(100, Math.max(10, parseInt(qualityEl.value, 10) || 80)) / 100;
          var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(function (blob) {
            if (!blob) { showError('Compression failed in this browser.'); return; }
            if (downloadEl.href && downloadEl.href.indexOf('blob:') === 0) {
              URL.revokeObjectURL(downloadEl.href);
            }
            var url = URL.createObjectURL(blob);
            downloadEl.href = url;
            var ext = mime === 'image/png' ? 'png' : 'jpg';
            downloadEl.download = 'compressed.' + ext;
            document.getElementById('ic-orig-size').textContent = fmtBytes(file.size);
            document.getElementById('ic-new-size').textContent = fmtBytes(blob.size);
            var saved = file.size > 0 ? Math.round((1 - blob.size / file.size) * 100) : 0;
            document.getElementById('ic-saved').textContent = saved + '%';
            document.getElementById('ic-note').textContent =
              'Compressed to ' + w + ' × ' + h + ' px at quality ' + Math.round(quality * 100) + '.';
            resultEl.hidden = false;
            trackUse();
          }, mime, quality);
        } catch (e) {
          showError('Compression failed: ' + e.message);
        }
      };
      img.onerror = function () { showError('Could not read that image file.'); };
      img.src = reader.result;
    };
    reader.onerror = function () { showError('Could not read that file.'); };
    reader.readAsDataURL(file);
  });
})();
