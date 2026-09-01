(() => {
  const enhanceFinancialCenterFooters = () => {
    document.querySelectorAll('.tv-footer-grid').forEach((grid, index) => {
      const column = Array.from(grid.querySelectorAll('.tv-footer-column')).find((candidate) => {
        const heading = candidate.querySelector('.tv-footer-heading');
        return candidate.dataset.fintechFooter === 'true' || heading?.textContent.trim() === 'Financial Centers';
      });
      if (!column || column.dataset.fintechFooterEnhanced === 'true') return;
      const links = Array.from(column.querySelectorAll(':scope > a'));
      if (!links.length) return;
      const panelId = `tv-footer-financial-centers-${index}`;
      column.classList.add('tv-footer-accordion');
      column.dataset.fintechFooterEnhanced = 'true';
      column.innerHTML = `<button type="button" class="tv-footer-accordion-toggle" data-footer-accordion-toggle aria-expanded="false" aria-controls="${panelId}"><span>Financial Centers</span><svg class="tv-footer-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path></svg></button><p class="tv-footer-heading" role="heading" aria-level="2">Financial Centers</p><div class="tv-footer-accordion-panel" id="${panelId}" data-footer-accordion-panel hidden>${links.map((link) => link.outerHTML).join('')}</div>`;
    });
  };
  const enhanceFinancialCenterMobile = () => {
    document.querySelectorAll('[data-mobile-accordion-group="tools"]').forEach((group) => {
      if (group.querySelector('[data-fintech-mobile-category]')) return;
      const section = document.createElement('section');
      section.className = 'tv-mobile-category';
      section.dataset.fintechMobileCategory = 'true';
      section.innerHTML = '<button class="tv-mobile-category-toggle" type="button" data-mobile-accordion-toggle aria-expanded="false" aria-controls="tv-mobile-tools-financial-centers-panel"><span>Financial Centers</span><svg class="tv-mobile-category-chevron" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7 6l6 4-6 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button><div class="tv-mobile-category-panel" id="tv-mobile-tools-financial-centers-panel" data-mobile-accordion-panel hidden><a href="debt-consolidation-vs-settlement-calculator.html">Debt Consolidation vs. Settlement</a><a href="auto-loan-refinance-negative-equity-calculator.html">Auto Refinance &amp; Negative Equity</a><a href="tax-withholding-refund-gap-calculator.html">Tax Withholding &amp; Refund Gap</a><a href="aca-net-premium-total-cost-calculator.html">ACA Net Premium &amp; Total Cost</a><a href="credit-utilization-interest-simulator.html">Credit Utilization &amp; Interest</a><a href="mortgage-refinance-break-even-calculator.html">Mortgage Refinance Break-Even</a><a href="emergency-fund-income-shock-calculator.html">Emergency Fund &amp; Income Shock</a></div>';
      group.appendChild(section);
    });
  };
  enhanceFinancialCenterFooters();
  enhanceFinancialCenterMobile();
  const menus = Array.from(document.querySelectorAll('[data-tv-menu]'));
  const categoryToggles = Array.from(document.querySelectorAll('[data-mobile-accordion-toggle]'));
  const footerToggles = Array.from(document.querySelectorAll('[data-footer-accordion-toggle]'));
  if (!menus.length && !categoryToggles.length && !footerToggles.length) return;

  const closeOtherMenus = (active) => {
    menus.forEach((menu) => {
      if (menu !== active) menu.removeAttribute('open');
    });
  };

  const setPanelState = (toggle, expanded) => {
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  };

  const setFooterState = (toggle, expanded) => {
    setPanelState(toggle, expanded);
  };

  const bindFooterToggle = (toggle) => {
    if (toggle.dataset.tvBound === 'true') return;
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    toggle.dataset.tvBound = 'true';
    toggle.addEventListener('click', () => {
      setFooterState(toggle, toggle.getAttribute('aria-expanded') !== 'true');
    });
  };

  const syncFooterAccordions = () => {
    const mobile = window.matchMedia ? window.matchMedia('(max-width: 980px)').matches : window.innerWidth <= 980;
    footerToggles.forEach((toggle) => {
      setFooterState(toggle, mobile ? toggle.getAttribute('aria-expanded') === 'true' : true);
    });
  };

  const closeMobileCategories = (mobileMenu) => {
    mobileMenu.querySelectorAll('[data-mobile-accordion-toggle]').forEach((toggle) => {
      setPanelState(toggle, false);
    });
  };

  const closeFooterAccordions = () => {
    footerToggles.forEach((toggle) => setFooterState(toggle, false));
  };

  categoryToggles.forEach((toggle) => {
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    setPanelState(toggle, false);
    toggle.addEventListener('click', () => {
      setPanelState(toggle, toggle.getAttribute('aria-expanded') !== 'true');
    });
  });

  footerToggles.forEach(bindFooterToggle);

  syncFooterAccordions();
  window.addEventListener('resize', syncFooterAccordions, { passive: true });
  window.tvEnhanceFinancialCenterFooters = () => {
    enhanceFinancialCenterFooters();
    document.querySelectorAll('[data-footer-accordion-toggle]').forEach((toggle) => {
      bindFooterToggle(toggle);
      const mobile = window.matchMedia ? window.matchMedia('(max-width: 980px)').matches : window.innerWidth <= 980;
      setFooterState(toggle, mobile ? toggle.getAttribute('aria-expanded') === 'true' : true);
    });
  };

  menus.forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        closeOtherMenus(menu);
      } else if (menu.classList.contains('tv-mobile-nav')) {
        closeMobileCategories(menu);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menus.forEach((menu) => menu.removeAttribute('open'));
      closeFooterAccordions();
    }
  });

  document.addEventListener('click', (event) => {
    if (!menus.some((menu) => menu.contains(event.target))) {
      menus.forEach((menu) => menu.removeAttribute('open'));
    }
  });
})();

(() => {
  const basePath = '/ToolVerse/';
  const swPath = `${basePath}sw.js`;
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const dismissedKey = 'tv-pwa-install-dismissed';
  let deferredPrompt = null;
  let promptCard = null;

  const addStyles = () => {
    if (document.getElementById('tv-pwa-install-styles')) return;
    const style = document.createElement('style');
    style.id = 'tv-pwa-install-styles';
    style.textContent = `
      .tv-pwa-install-card{position:fixed;z-index:1000;right:1rem;bottom:1rem;width:min(22rem,calc(100vw - 2rem));padding:1rem;border:1px solid rgba(103,232,249,.24);border-radius:1rem;background:rgba(8,18,35,.96);box-shadow:0 18px 50px rgba(0,0,0,.35);color:#e2e8f0;font:500 .875rem/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .tv-pwa-install-card strong{display:block;margin-bottom:.25rem;color:#fff;font-size:.95rem}
      .tv-pwa-install-card p{margin:0 2rem .75rem 0;color:#a8b6cc}
      .tv-pwa-install-actions{display:flex;align-items:center;gap:.6rem}
      .tv-pwa-install-action{border:0;border-radius:.65rem;padding:.55rem .8rem;background:linear-gradient(135deg,#67e8f9,#a78bfa);color:#07111f;font-weight:800;cursor:pointer}
      .tv-pwa-install-dismiss{border:0;padding:.45rem;background:transparent;color:#94a3b8;cursor:pointer}
      .tv-pwa-install-close{position:absolute;top:.55rem;right:.65rem;border:0;background:transparent;color:#94a3b8;font-size:1.2rem;line-height:1;cursor:pointer}
      @media (max-width:640px){.tv-pwa-install-card{right:.75rem;bottom:.75rem;width:calc(100vw - 1.5rem)}}
    `;
    document.head.appendChild(style);
  };

  const removeCard = () => {
    if (promptCard) promptCard.remove();
    promptCard = null;
  };

  const rememberDismissal = () => {
    try { localStorage.setItem(dismissedKey, String(Date.now())); } catch (_) { /* optional preference only */ }
  };

  const wasDismissedRecently = () => {
    try {
      const value = Number(localStorage.getItem(dismissedKey));
      return Number.isFinite(value) && Date.now() - value < 1000 * 60 * 60 * 24 * 30;
    } catch (_) { return false; }
  };

  const showCard = ({ ios = false } = {}) => {
    if (promptCard || isStandalone() || wasDismissedRecently()) return;
    addStyles();
    promptCard = document.createElement('aside');
    promptCard.className = 'tv-pwa-install-card';
    promptCard.setAttribute('aria-label', 'Install ToolVerse');
    promptCard.innerHTML = ios
      ? '<button class="tv-pwa-install-close" type="button" aria-label="Dismiss install instructions">×</button><strong>Install ToolVerse</strong><p>Open ToolVerse faster from your home screen. In Safari, tap Share → Add to Home Screen. If available, choose Open as Web App.</p><div class="tv-pwa-install-actions"><button class="tv-pwa-install-dismiss" type="button">Not now</button></div>'
      : '<button class="tv-pwa-install-close" type="button" aria-label="Dismiss install prompt">×</button><strong>Install ToolVerse</strong><p>Open ToolVerse faster from your home screen.</p><div class="tv-pwa-install-actions"><button class="tv-pwa-install-action" type="button">Install</button><button class="tv-pwa-install-dismiss" type="button">Not now</button></div>';
    document.body.appendChild(promptCard);
    promptCard.querySelector('.tv-pwa-install-close').addEventListener('click', () => { rememberDismissal(); removeCard(); });
    promptCard.querySelector('.tv-pwa-install-dismiss').addEventListener('click', () => { rememberDismissal(); removeCard(); });
    if (!ios) {
      promptCard.querySelector('.tv-pwa-install-action').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        const prompt = deferredPrompt;
        deferredPrompt = null;
        removeCard();
        try { await prompt.prompt(); } catch (_) { /* browser controls prompt errors */ }
      });
    }
  };

  const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(swPath, { scope: basePath }).catch(() => {});
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showCard();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    removeCard();
  });

  window.addEventListener('load', () => {
    registerServiceWorker();
    if (isIOS && !isStandalone()) showCard({ ios: true });
  }, { once: true });
})();
/* ToolVerse fintech centers: additive discovery links for the existing Tools menu. */
const runFintechCenterInjection = () => {
  const centers = [
    ['debt-consolidation-vs-settlement-calculator.html','Debt Center'],
    ['auto-loan-refinance-negative-equity-calculator.html','Auto Finance Center'],
    ['tax-withholding-refund-gap-calculator.html','Tax Center'],
    ['aca-net-premium-total-cost-calculator.html','Health Coverage Center'],
    ['credit-utilization-interest-simulator.html','Credit Center'],
    ['mortgage-refinance-break-even-calculator.html','Homeowner Center'],
    ['emergency-fund-income-shock-calculator.html','Emergency Fund']
  ];
  document.querySelectorAll('[data-tv-menu]').forEach(menu => {
    const summary = menu.querySelector('summary');
    const panel = menu.querySelector('.tv-menu-panel, .tv-mega');
    if (!summary || !panel || summary.textContent.trim() !== 'Tools' || panel.querySelector('[data-fintech-center]')) return;
    const mega = panel.classList.contains('tv-mega');
    const wrap = document.createElement(mega ? 'section' : 'div');
    wrap.dataset.fintechCenter = 'true';
    if (mega) wrap.className = 'tv-mega-group';
    wrap.innerHTML = mega
      ? '<span class="tv-mega-title">Financial Centers</span>' + centers.map(([href,label]) => `<a class="tv-mega-link" href="${href}">${label}<span>Compare the key trade-offs privately in your browser.</span></a>`).join('')
      : '<strong class="tv-menu-section-label">Financial Centers</strong>' + centers.map(([href,label]) => `<a href="${href}">${label}</a>`).join('');
    panel.appendChild(wrap);
  });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runFintechCenterInjection, { once: true });
else runFintechCenterInjection();
/* ToolVerse fintech footer discovery: additive links for existing page shells. */
const runFintechFooterInjection = () => {
  const centers = [
    ['debt-consolidation-vs-settlement-calculator.html','Debt Center'],
    ['auto-loan-refinance-negative-equity-calculator.html','Auto Finance Center'],
    ['tax-withholding-refund-gap-calculator.html','Tax Center'],
    ['aca-net-premium-total-cost-calculator.html','Health Coverage Center'],
    ['credit-utilization-interest-simulator.html','Credit Center'],
    ['mortgage-refinance-break-even-calculator.html','Homeowner Center'],
    ['emergency-fund-income-shock-calculator.html','Emergency Fund']
  ];
  document.querySelectorAll('.tv-footer-grid').forEach(grid => {
    if (grid.querySelector('[data-fintech-footer], a[href="debt-consolidation-vs-settlement-calculator.html"]')) return;
    const nav = document.createElement('nav');
    nav.className = 'tv-footer-column';
    nav.dataset.fintechFooter = 'true';
    nav.setAttribute('aria-label', 'Financial centers');
    nav.innerHTML = '<p class="tv-footer-heading" role="heading" aria-level="2">Financial Centers</p>' + centers.map(([href,label]) => `<a href="${href}">${label}</a>`).join('');
    grid.appendChild(nav);
  });
  window.tvEnhanceFinancialCenterFooters?.();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runFintechFooterInjection, { once: true });
else runFintechFooterInjection();
