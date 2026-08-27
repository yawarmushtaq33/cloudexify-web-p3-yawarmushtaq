/**
 * offers.js
 * Pricing "Choose Plan" buttons open a Plan Offer modal showing that plan's
 * details (read directly from its pricing card — single source of truth,
 * so this can never drift out of sync with the pricing section). Only when
 * the user clicks "Book This Plan" inside that offer does the booking
 * modal open, pre-filled with the chosen plan and a sensible default service.
 *
 * No-ops harmlessly on any page without pricing cards / the offer modal.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const offerModalEl = document.getElementById('planOfferModal');
    const appointmentModalEl = document.getElementById('appointmentModal');
    if (!offerModalEl || !appointmentModalEl || !window.bootstrap) return;

    const offerPlanName = document.getElementById('offerPlanName');
    const offerPlanDesc = document.getElementById('offerPlanDesc');
    const offerPlanPrice = document.getElementById('offerPlanPrice');
    const offerFeaturesList = document.getElementById('offerFeaturesList');
    const offerBookBtn = document.getElementById('offerBookBtn');

    const patientPlanEl = document.getElementById('patientPlan');
    const patientServiceEl = document.getElementById('patientService');
    const planBanner = document.getElementById('bookingPlanBanner');
    const planBannerName = document.getElementById('bookingPlanBannerName');

    let pendingPlan = null;
    let pendingService = null;
    let pendingPlanLabel = null;

    // Populate the offer modal from whichever plan button was clicked,
    // reading straight out of that button's own pricing card.
    offerModalEl.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const plan = trigger.getAttribute('data-plan') || '';
      const service = trigger.getAttribute('data-service') || '';
      const card = trigger.closest('.pricing-card');
      if (!card) return;

      const nameEl = card.querySelector('.pricing-name');
      const descEl = card.querySelector('.pricing-desc');
      const priceEl = card.querySelector('.pricing-price');
      const featureEls = card.querySelectorAll('.pricing-features li');

      const label = nameEl ? nameEl.textContent.trim() : 'Plan';

      if (offerPlanName) offerPlanName.textContent = label;
      if (offerPlanDesc) offerPlanDesc.textContent = descEl ? descEl.textContent.trim() : '';
      if (offerPlanPrice) offerPlanPrice.innerHTML = priceEl ? priceEl.innerHTML : '';
      if (offerFeaturesList) {
        offerFeaturesList.innerHTML = '';
        featureEls.forEach((li) => {
          const clone = li.cloneNode(true);
          offerFeaturesList.appendChild(clone);
        });
      }

      pendingPlan = plan;
      pendingService = service;
      pendingPlanLabel = label;
    });

    if (offerBookBtn) {
      offerBookBtn.addEventListener('click', function () {
        // Hand off: close the offer, then open the real booking modal
        // pre-filled with the plan the patient just reviewed.
        if (patientPlanEl) patientPlanEl.value = pendingPlan || '';
        if (patientServiceEl && pendingService) patientServiceEl.value = pendingService;
        if (planBanner && planBannerName && pendingPlanLabel) {
          planBannerName.textContent = pendingPlanLabel;
          planBanner.classList.remove('d-none');
        }

        const offerModal = bootstrap.Modal.getOrCreateInstance(offerModalEl);
        offerModal.hide();

        // Wait for the offer modal to finish closing before opening the next
        // one — Bootstrap doesn't support two modals stacked by default.
        offerModalEl.addEventListener(
          'hidden.bs.modal',
          function openBooking() {
            offerModalEl.removeEventListener('hidden.bs.modal', openBooking);
            const bookingModal = bootstrap.Modal.getOrCreateInstance(appointmentModalEl);
            bookingModal.show();
          },
          { once: true }
        );
      });
    }
  });
})();
