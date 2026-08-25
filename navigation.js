(() => {
  const menus = Array.from(document.querySelectorAll('[data-tv-menu]'));
  if (!menus.length) return;

  const closeOtherMenus = (active) => {
    menus.forEach((menu) => {
      if (menu !== active) menu.removeAttribute('open');
    });
  };

  menus.forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (menu.open) closeOtherMenus(menu);
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
