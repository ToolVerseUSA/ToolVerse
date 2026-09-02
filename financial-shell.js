(() => {
  const header = document.querySelector('[data-financial-shell-header]');
  if (!header) return;
  const trigger = header.querySelector('.tv-mobile-trigger');
  const panel = document.getElementById(trigger?.getAttribute('aria-controls') || '');
  let returnFocus = null;
  const setMenu = (open, restore = false) => {
    if (!trigger || !panel) return;
    trigger.setAttribute('aria-expanded', String(open));
    trigger.querySelector('.tv-sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
    panel.hidden = !open;
    document.body.classList.toggle('tv-nav-open', open);
    if (open) {
      returnFocus = document.activeElement;
      requestAnimationFrame(() => panel.querySelector('a,button')?.focus());
    } else if (restore) (returnFocus || trigger).focus();
  };
  trigger?.addEventListener('click', () => setMenu(trigger.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('.tv-mobile-category-toggle').forEach((button) => {
    const controlled = document.getElementById(button.getAttribute('aria-controls'));
    if (!controlled) return;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      controlled.hidden = !open;
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && trigger?.getAttribute('aria-expanded') === 'true') { event.preventDefault(); setMenu(false, true); }
    if (event.key === 'Tab' && trigger?.getAttribute('aria-expanded') === 'true') {
      const focusable = [...panel.querySelectorAll('a[href],button:not([disabled])')].filter(x => !x.closest('[hidden]'));
      if (!focusable.length) return;
      const first=focusable[0], last=focusable.at(-1);
      if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', (event) => {
    if (trigger?.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
  });
  window.addEventListener('resize', () => { if (innerWidth > 1080 && trigger?.getAttribute('aria-expanded') === 'true') setMenu(false); }, {passive:true});
  header.querySelectorAll('.tv-menu').forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) header.querySelectorAll('.tv-menu[open]').forEach(other => { if(other!==menu) other.open=false; }); }));

  document.querySelectorAll('[data-financial-shell-footer] .tv-footer-accordion-toggle').forEach(button => {
    const section=document.getElementById(button.getAttribute('aria-controls'));
    if(!section) return;
    const sync=()=>{ const mobile=matchMedia('(max-width:700px)').matches; if(!mobile){section.hidden=false;button.setAttribute('aria-expanded','true');} else if(button.dataset.mobileReady!=='1'){section.hidden=true;button.setAttribute('aria-expanded','false');button.dataset.mobileReady='1';}};
    button.addEventListener('click',()=>{if(!matchMedia('(max-width:700px)').matches)return;const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));section.hidden=!open;});
    sync(); addEventListener('resize',sync,{passive:true});
  });
})();
