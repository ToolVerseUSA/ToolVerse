/* ToolVerse browser-tools analytics helper (Phase 1).
 * Uses the site's EXISTING GA4 setup (window.gtag) when present — it does not
 * replace or duplicate the GA4 snippet. Analytics must never break tools,
 * and tool INPUT VALUES are never sent — only tool_id / tool_category.
 */
(function () {
  'use strict';
  window.ToolVerseTools = window.ToolVerseTools || {};
  window.ToolVerseTools.track = function (toolId, category, action) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', action || 'tool_use', {
          tool_id: String(toolId),
          tool_category: String(category)
        });
      }
    } catch (e) {
      /* analytics must never break tools */
    }
  };
})();
