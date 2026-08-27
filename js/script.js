/**
 * script.js
 * Main orchestrator: loading screen, scroll progress indicator,
 * back-to-top button, chat widget toggle, and testimonial carousel
 * indicator sync. Loaded last, after all feature modules.
 */
(function () {
  'use strict';

  /* ---- Loading screen ---- */
  window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      window.setTimeout(() => {
        loadingScreen.classList.add('loaded');
      }, 350);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    /* ---- Scroll progress bar ---- */
    const progressBar = document.getElementById('scroll-progress');
    function updateProgress() {
      if (!progressBar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    /* ---- Back to top button ---- */
    const backToTopBtn = document.getElementById('backToTop');
    function toggleBackToTop() {
      if (!backToTopBtn) return;
      backToTopBtn.classList.toggle('visible', window.scrollY > 500);
    }
    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* ---- Chat widget (Tawk.to placeholder) ----
       This is a lightweight placeholder panel that mimics a live-chat
       widget's UI. Replace the panel body with a real Tawk.to embed
       script when ready — see the comment in index.html for the spot. */
    const chatBtn = document.getElementById('chatWidgetBtn');
    const chatPanel = document.getElementById('chatWidgetPanel');
    const chatCloseBtn = document.getElementById('chatWidgetClose');

    if (chatBtn && chatPanel) {
      chatBtn.addEventListener('click', function () {
        const isOpen = chatPanel.classList.toggle('open');
        chatBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }
    if (chatCloseBtn && chatPanel) {
      chatCloseBtn.addEventListener('click', function () {
        chatPanel.classList.remove('open');
        if (chatBtn) chatBtn.setAttribute('aria-expanded', 'false');
      });
    }

    /* ---- Testimonial carousel — custom indicator sync ---- */
    const testimonialCarousel = document.getElementById('testimonialCarousel');
    if (testimonialCarousel && window.bootstrap) {
      const indicatorsWrap = document.getElementById('testimonialIndicators');
      const items = testimonialCarousel.querySelectorAll('.carousel-item');

      if (indicatorsWrap && items.length) {
        items.forEach((item, index) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Go to testimonial ' + (index + 1));
          if (index === 0) dot.classList.add('active');
          dot.addEventListener('click', () => {
            const carousel = bootstrap.Carousel.getOrCreateInstance(testimonialCarousel);
            carousel.to(index);
          });
          indicatorsWrap.appendChild(dot);
        });

        testimonialCarousel.addEventListener('slid.bs.carousel', function (e) {
          const dots = indicatorsWrap.querySelectorAll('button');
          dots.forEach((d, i) => d.classList.toggle('active', i === e.to));
        });
      }
    }

    /* ---- Current year in footer ---- */
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
