(function initSharedHeader() {
  const logo = `
    <svg class="site-header__logo" width="150" height="40" viewBox="0 0 150 40" role="img" aria-labelledby="siteLogoTitle">
      <title id="siteLogoTitle">My Sindbad</title>
      <path d="M7 25c4-1 8-1 12 0l5 5H12c-3 0-5-2-5-5Z" fill="#D4AF37"/>
      <path d="M17 10v15l11-7-11-8Z" fill="#D4AF37"/>
      <path d="M17 10h10" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M5 31h26" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round"/>
      <text x="37" y="24" fill="#FFFFFF" font-family="Georgia, serif" font-size="17" font-weight="700">My Sindbad</text>
      <circle cx="143" cy="20" r="3" fill="#D4AF37"/>
    </svg>`;

  function headerMarkup() {
    return `
      <header class="site-header" id="mainHeader">
        <div class="site-header__inner">
          <a class="site-header__brand" href="./index.html" aria-label="My Sindbad - الرئيسية">${logo}</a>
          <a class="site-header__home" href="./index.html">الرئيسية</a>
        </div>
      </header>`;
  }

  function setScrolledState() {
    const header = document.getElementById('mainHeader');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 50);
  }

  function mount() {
    document.querySelectorAll('[data-site-header]').forEach((host) => {
      if (host.dataset.mounted === 'true') return;
      host.className = 'site-header-host';
      host.innerHTML = headerMarkup();
      host.dataset.mounted = 'true';
    });
    setScrolledState();
  }

  function start() {
    mount();
    window.addEventListener('scroll', setScrolledState, { passive: true });
    new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();