(() => {
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

  footerToggles.forEach((toggle) => {
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    toggle.addEventListener('click', () => {
      setFooterState(toggle, toggle.getAttribute('aria-expanded') !== 'true');
    });
  });

  syncFooterAccordions();
  window.addEventListener('resize', syncFooterAccordions, { passive: true });

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
