(function initSharedHeader() {
  const logo = `
    <svg class="site-header__logo" width="160" height="40" viewBox="0 0 160 40" role="img" aria-labelledby="siteLogoTitle">
      <title id="siteLogoTitle">My Sindbad</title>
      <path d="M8 28 Q12 22, 16 28 L22 34 L10 34 Z" fill="#D4AF37"/>
      <path d="M16 8 L16 26 L28 20 Z" fill="#D4AF37"/>
      <text x="35" y="22" fill="#D4AF37" font-family="Arial, sans-serif" font-size="18" font-weight="bold">My Sindbad</text>
      <text x="35" y="34" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="9">رفيق السفر</text>
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