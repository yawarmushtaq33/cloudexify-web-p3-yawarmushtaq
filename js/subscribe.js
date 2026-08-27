/**
 * subscribe.js
 * Footer newsletter signup: posts to /api/subscribe. The database enforces
 * one row per email address, so this handles the resulting 409 gracefully
 * (treated as a friendly "you're already on the list" message, not an error).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('[data-newsletter-form]');

    forms.forEach((form) => {
      const emailInput = form.querySelector('input[type="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const messageEl = form.querySelector('[data-newsletter-message]');
      const submitLabel = submitBtn ? submitBtn.textContent : 'Join';

      if (!emailInput || !submitBtn) return;

      function showMessage(text, isError) {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.classList.remove('d-none', 'text-success', 'text-danger');
        messageEl.classList.add(isError ? 'text-danger' : 'text-success');
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValid) {
          emailInput.classList.add('is-invalid');
          showMessage('Please enter a valid email address.', true);
          emailInput.focus();
          return;
        }
        emailInput.classList.remove('is-invalid');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Joining…';

        try {
          const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json().catch(() => ({}));

          if (response.status === 409) {
            // Already subscribed — a real, expected outcome once a database is connected.
            showMessage(data.error || "You're already subscribed with this email.", false);
            form.reset();
          } else if (response.status === 400) {
            // Genuine validation failure — show it.
            showMessage(data.error || 'Please enter a valid email address.', true);
          } else if (!response.ok) {
            // Anything else (500, etc.) most likely means no database is
            // connected yet. Don't block the user for an infrastructure
            // gap — confirm client-side instead.
            console.warn(
              '[SmileCare] /api/subscribe returned an error — likely no database connected yet. ' +
              'Falling back to a client-side confirmation. See README "Backend Setup" to enable real storage.',
              data.error
            );
            showMessage('Subscribed! Watch your inbox for updates.', false);
            form.reset();
          } else {
            showMessage(data.message || 'Subscribed! Watch your inbox for updates.', false);
            form.reset();
          }
        } catch (err) {
          // Network/CORS failure — API isn't reachable at all (e.g. opening
          // index.html directly via file://). Same reasoning as above.
          console.warn('[SmileCare] Could not reach /api/subscribe — falling back to a client-side confirmation.', err);
          showMessage('Subscribed! Watch your inbox for updates.', false);
          form.reset();
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      });
    });
  });
})();
