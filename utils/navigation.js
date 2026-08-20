(function initSharedNavigation() {
  const pages = [
    { id: 'home', href: './index.html', label: 'الرئيسية', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6"/></svg>' },
    { id: 'trip', href: './itinerary.html', label: 'رحلتي', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19 9 2-9-18-9 18 9-2Zm0 0v-8"/></svg>' },
    { id: 'map', href: './map.html', label: 'الخريطة', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 20-5.4-2.7A1 1 0 0 1 3 16.4V5.6a1 1 0 0 1 1.4-.9L9 7m0 13 6-3m-6 3V7m6 10 4.6 2.3a1 1 0 0 0 1.4-.9V7.6a1 1 0 0 0-.6-.9L15 4m0 13V4M15 4 9 7"/></svg>' },
    { id: 'explore', href: './explore.html', label: 'استكشف', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-11v7m-3.5-3.5h7"/></svg>' },
    { id: 'community', href: './community.html', label: 'المجتمع', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20H8m8 0v-2a4 4 0 0 0-8 0v2m8 0h5v-2a3 3 0 0 0-5.4-1.8M8 20H3v-2a3 3 0 0 1 5.4-1.8M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>' },
    { id: 'profile', href: './profile.html', label: 'حسابي', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>' }
  ];

  function mount() {
    document.querySelectorAll('[data-site-nav]:not([data-mounted])').forEach((nav) => {
    const active = nav.dataset.active;
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'التنقل الرئيسي');
    nav.innerHTML = pages.map((page) => `
      <a href="${page.href}" class="${page.id === active ? 'active' : ''}" ${page.id === active ? 'aria-current="page"' : ''}>
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