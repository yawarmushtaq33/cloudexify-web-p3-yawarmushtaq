/**
 * slider.js
 * Draggable Before & After comparison slider.
 * Supports mouse drag, touch drag, and keyboard (arrow keys).
 */
(function () {
  'use strict';

  function initSlider(sliderEl) {
    const beforeWrap = sliderEl.querySelector('.ba-before-wrap');
    const handle = sliderEl.querySelector('.ba-handle');
    const afterImg = sliderEl.querySelector('.ba-after');
    let isDragging = false;

    function setPosition(percent) {
      const clamped = Math.max(0, Math.min(100, percent));
      beforeWrap.style.width = clamped + '%';
      handle.style.left = clamped + '%';
      handle.setAttribute('aria-valuenow', Math.round(clamped));

      // Keep the "before" image visually full-width relative to the container
      if (afterImg) {
        const containerWidth = sliderEl.offsetWidth;
        beforeWrap.querySelector('img').style.width = containerWidth + 'px';
      }
    }

    function percentFromClientX(clientX) {
      const rect = sliderEl.getBoundingClientRect();
      const x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function handleMove(clientX) {
      setPosition(percentFromClientX(clientX));
    }

    // Mouse events
    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });
    sliderEl.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleMove(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events
    sliderEl.addEventListener(
      'touchstart',
      (e) => {
        isDragging = true;
        handleMove(e.touches[0].clientX);
      },
      { passive: true }
    );
    sliderEl.addEventListener(
      'touchmove',
      (e) => {
        if (!isDragging) return;
        handleMove(e.touches[0].clientX);
      },
      { passive: true }
    );
    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Keyboard accessibility
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.setAttribute('aria-label', 'Drag to compare before and after treatment images');

    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      let next = current;
      if (e.key === 'ArrowLeft') next = current - 5;
      else if (e.key === 'ArrowRight') next = current + 5;
      else return;
      e.preventDefault();
      setPosition(next);
    });

    // Initialize at 50%
    window.addEventListener('resize', () => {
      const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      setPosition(current);
    });

    setPosition(50);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.ba-slider').forEach(initSlider);
  });
})();
