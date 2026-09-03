(() => {
  const header = document.querySelector('[data-financial-shell-header]');
  if (!header) return;
  const main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    const skip = document.createElement('a');
    skip.className = 'tv-skip-link';
    skip.href = `#${main.id}`;
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
    skip.addEventListener('click', () => {
      main.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => main.focus({ preventScroll: true }));
    });
  }

  const currentPath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:)/.test(href)) return;
    if (href.split('#')[0].split('?')[0] === currentPath) link.setAttribute('aria-current', 'page');
  });

  document.querySelectorAll('form').forEach((form, formIndex) => {
    const error = form.querySelector('.form-error,.tv-fintech-error,[role="alert"]');
    if (error) {
      if (!error.id) error.id = `form-error-${formIndex + 1}`;
      error.setAttribute('role', 'alert');
      error.setAttribute('aria-live', 'assertive');
      const describedBy = new Set((form.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(error.id);
      form.setAttribute('aria-describedby', [...describedBy].join(' '));
    }
    form.querySelectorAll('[aria-live="polite"]').forEach(status => {
      if (!status.hasAttribute('role')) status.setAttribute('role', 'status');
      status.setAttribute('aria-atomic', 'true');
    });
  });

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

  const footer = document.querySelector('[data-financial-shell-footer]');
  if (footer) {
    const groups = [
      ['Financial Tools', [
        ['Housing & Rent', 'index.html#calculator'],
        ['Home Buying', 'home-affordability-calculator.html'],
        ['Debt & Credit', 'debt-consolidation-vs-settlement-calculator.html'],
        ['Auto & Insurance', 'car-insurance-cost-estimator.html'],
        ['Salary & Taxes', 'tax-withholding-refund-gap-calculator.html'],
        ['Health Coverage', 'aca-net-premium-total-cost-calculator.html'],
        ['Emergency Planning', 'emergency-fund-income-shock-calculator.html']
      ]],
      ['Resources', [
        ['Guides', 'salary-rent-affordability-guide.html'],
        ['Financial Centers', 'debt-consolidation-vs-settlement-calculator.html'],
        ['All financial tools', 'all-categories.html'],
        ['Sitemap', 'sitemap.html']
      ]],
      ['Company', [
        ['About ToolVerse', 'about.html'],
        ['Contact', 'contact.html']
      ]],
      ['Legal & Trust', [
        ['Privacy', 'privacy.html'],
        ['Terms', 'terms.html'],
        ['Disclaimer', 'disclaimer.html'],
        ['Affiliate disclosure', 'affiliate-disclosure.html']
      ]]
    ];
    const columns = groups.map(([label, links], index) => `
      <nav class="tv-footer-column" aria-label="${label}">
        <button class="tv-footer-accordion-toggle" type="button" aria-expanded="false" aria-controls="tv-footer-${index}"><span>${label}</span><span aria-hidden="true">⌄</span></button>
        <p class="tv-footer-heading" role="heading" aria-level="2">${label}</p>
        <div class="tv-footer-accordion-panel" id="tv-footer-${index}">${links.map(([text, href]) => `<a href="${href}">${text}</a>`).join('')}</div>
      </nav>`).join('');
    footer.innerHTML = `<div class="tv-footer-inner">
      <section class="tv-footer-cta"><div><p class="tv-footer-cta-eyebrow">Plan with more clarity</p><h2>Make your next money decision with more clarity.</h2><p>Private, browser-based tools for everyday U.S. financial decisions.</p></div><a class="tv-footer-cta-link" href="index.html#calculator">Start Free Calculator <span aria-hidden="true">→</span></a></section>
      <div class="tv-footer-grid"><section class="tv-footer-brand"><a class="tv-brand" href="index.html" aria-label="ToolVerse home"><span class="tv-brand-mark" aria-hidden="true">TV</span><span>Tool<b>Verse</b></span></a><p>Clear, independent planning tools for understanding everyday financial trade-offs before you act.</p><p class="tv-footer-trust">Free · No account · Runs in your browser</p></section>${columns}</div>
      <div class="tv-footer-bottom"><span>© 2026 ToolVerse</span><span>Educational estimates only — not financial, tax, legal, or insurance advice.</span></div>
    </div>`;

    const accordions = [...footer.querySelectorAll('.tv-footer-accordion-toggle')];
    const syncFooter = () => accordions.forEach(button => {
      const section = document.getElementById(button.getAttribute('aria-controls'));
      if (!section) return;
      const mobile = matchMedia('(max-width:700px)').matches;
      if (!mobile) { section.hidden = false; button.setAttribute('aria-expanded', 'true'); }
      else if (button.dataset.mobileReady !== '1') { section.hidden = true; button.setAttribute('aria-expanded', 'false'); button.dataset.mobileReady = '1'; }
    });
    accordions.forEach(button => button.addEventListener('click', () => {
      if (!matchMedia('(max-width:700px)').matches) return;
      const section = document.getElementById(button.getAttribute('aria-controls'));
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      section.hidden = !open;
    }));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !matchMedia('(max-width:700px)').matches) return;
      const open = accordions.find(button => button.getAttribute('aria-expanded') === 'true');
      if (!open) return;
      event.preventDefault();
      accordions.forEach(button => {
        const section = document.getElementById(button.getAttribute('aria-controls'));
        button.setAttribute('aria-expanded', 'false');
        if (section) section.hidden = true;
      });
      open.focus();
    });
    syncFooter();
    addEventListener('resize', syncFooter, {passive:true});
  }
})();
