/**
 * navigation.js
 * Sticky navbar background on scroll, and auto-closing the mobile menu
 * after a link is tapped. Active-link highlighting is rendered directly
 * into each page's HTML (this is a real multi-page site, not a single
 * scrolling page), so no scroll-position-based logic is needed here.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('mainNavbar');
    const navLinks = document.querySelectorAll('.nav-link-custom');
    const navCollapseEl = document.getElementById('navbarContent');
    const toggler = document.querySelector('.navbar-toggler-custom');

    /* ---- Navbar background on scroll ---- */
    function handleScroll() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* ---- Auto-close mobile menu after a nav link is tapped ---- */
    if (navCollapseEl) {
      navLinks.forEach((link) => {
        link.addEventListener('click', () => {
          if (navCollapseEl.classList.contains('show') && window.bootstrap) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapseEl);
            bsCollapse.hide();
          }
        });
      });
    }

    if (toggler) {
      toggler.addEventListener('click', () => {
        const expanded = toggler.getAttribute('aria-expanded') === 'true';
        toggler.setAttribute('aria-expanded', String(!expanded));
      });
    }
  });
})();
