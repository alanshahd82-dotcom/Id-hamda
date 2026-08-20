(function initSharedHeader() {
  const logo = `
    <span class="site-header__mark" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 20L8 16L12 20L16 16L20 20L24 16L28 20" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 20V26H24V20" fill="#D4AF37"/>
        <path d="M16 8V16" stroke="#D4AF37" stroke-width="2"/>
        <path d="M16 8L22 12L16 16Z" fill="#D4AF37"/>
      </svg>
    </span>
    <span class="site-header__wordmark">
      <strong>My Sindbad</strong>
      <small>رفيق السفر</small>
    </span>`;

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