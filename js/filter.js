/**
 * filter.js
 * Live service filtering (General / Cosmetic / Orthodontics / All)
 * with smooth fade + scale transitions.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const serviceCards = document.querySelectorAll('[data-service-category]');
    const noResultsMsg = document.getElementById('noServicesMsg');

    if (filterButtons.length === 0 || serviceCards.length === 0) return;

    function applyFilter(category) {
      let visibleCount = 0;

      serviceCards.forEach((cardCol) => {
        const cardCategory = cardCol.getAttribute('data-service-category');
        const matches = category === 'all' || cardCategory === category;

        if (matches) {
          cardCol.classList.remove('filtered-out');
          visibleCount++;
          requestAnimationFrame(() => {
            cardCol.style.opacity = '1';
            cardCol.style.transform = 'scale(1)';
          });
        } else {
          cardCol.style.opacity = '0';
          cardCol.style.transform = 'scale(0.94)';
          window.setTimeout(() => {
            if (cardCol.getAttribute('data-service-category') !== category && category !== 'all') {
              cardCol.classList.add('filtered-out');
            }
          }, 250);
        }
      });

      if (noResultsMsg) {
        noResultsMsg.classList.toggle('show', visibleCount === 0);
      }
    }

    serviceCards.forEach((cardCol) => {
      cardCol.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    });

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        filterButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-pressed', 'true');
        applyFilter(this.getAttribute('data-filter'));
      });
    });
  });
})();
