(() => {
  const menus = Array.from(document.querySelectorAll('[data-tv-menu]'));
  if (!menus.length) return;

  const categoryToggles = Array.from(document.querySelectorAll('[data-mobile-accordion-toggle]'));

  const closeOtherMenus = (active) => {
    menus.forEach((menu) => {
      if (menu !== active) menu.removeAttribute('open');
    });
  };

  const setCategoryState = (toggle, expanded) => {
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  };

  const closeMobileCategories = (mobileMenu) => {
    mobileMenu.querySelectorAll('[data-mobile-accordion-toggle]').forEach((toggle) => {
      setCategoryState(toggle, false);
    });
  };

  categoryToggles.forEach((toggle) => {
    const panelId = toggle.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;
    setCategoryState(toggle, false);
    toggle.addEventListener('click', () => {
      setCategoryState(toggle, toggle.getAttribute('aria-expanded') !== 'true');
    });
  });

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
    }
  });

  document.addEventListener('click', (event) => {
    if (!menus.some((menu) => menu.contains(event.target))) {
      menus.forEach((menu) => menu.removeAttribute('open'));
    }
  });
})();
