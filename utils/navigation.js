(function initSharedNavigation() {
  const pages = [
    { id: 'home', href: './index.html', icon: '⌂', label: 'الرئيسية' },
    { id: 'explore', href: './explore.html', icon: '◈', label: 'استكشف' },
    { id: 'trip', href: './itinerary.html', icon: '✈', label: 'رحلتي' },
    { id: 'map', href: './map.html', icon: '⌖', label: 'الخريطة' },
    { id: 'community', href: './community.html', icon: '♧', label: 'المجتمع' },
    { id: 'profile', href: './profile.html', icon: '♙', label: 'حسابي' }
  ];

  function mount() {
    document.querySelectorAll('[data-site-nav]:not([data-mounted])').forEach((nav) => {
    const active = nav.dataset.active;
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'التنقل الرئيسي');
    const tripHref = nav.dataset.tripHref || './itinerary.html';
    nav.innerHTML = pages.map((page) => `
      <a href="${page.id === 'trip' ? tripHref : page.href}" class="${page.id === active ? 'active' : ''}" ${page.id === active ? 'aria-current="page"' : ''}>
        <span class="nav-icon" aria-hidden="true">${page.icon}</span>
        <span>${page.label}</span>
      </a>
    `).join('');
    nav.dataset.mounted = 'true';
    });
  }

  function start() {
    mount();
    new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();