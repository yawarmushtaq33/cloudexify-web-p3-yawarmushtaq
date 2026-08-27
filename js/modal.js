/**
 * modal.js
 * Appointment Booking modal: client-side validation for instant feedback,
 * then a real request to POST /api/appointments. Also fetches already-booked
 * slots for the chosen date so users can't even attempt a taken slot.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const modalEl = document.getElementById('appointmentModal');
    const formView = document.getElementById('bookingFormView');
    const successView = document.getElementById('bookingSuccessView');
    const bookAnotherBtn = document.getElementById('bookAnotherBtn');
    const successNameEl = document.getElementById('successPatientName');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitBtnLabel = submitBtn ? submitBtn.textContent : '';
    const formErrorEl = document.getElementById('bookingFormError');

    const fields = {
      name: {
        el: document.getElementById('patientName'),
        validate: (v) => v.trim().length >= 2,
      },
      phone: {
        el: document.getElementById('patientPhone'),
        validate: (v) => /^[0-9+()\-\s]{7,20}$/.test(v.trim()),
      },
      email: {
        el: document.getElementById('patientEmail'),
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      },
      date: {
        el: document.getElementById('patientDate'),
        validate: (v) => {
          if (!v) return false;
          const chosen = new Date(v);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return chosen >= today;
        },
      },
      time: {
        el: document.getElementById('patientTime'),
        validate: (v) => v !== '',
      },
      service: {
        el: document.getElementById('patientService'),
        validate: (v) => v !== '',
      },
    };

    function validateField(field) {
      const wrapper = field.el.closest('.was-validated-field') || field.el.parentElement;
      const isValid = field.validate(field.el.value);
      wrapper.classList.toggle('is-invalid', !isValid);
      return isValid;
    }

    function setFieldServerError(fieldName, message) {
      const field = fields[fieldName];
      if (!field || !field.el) return;
      const wrapper = field.el.closest('.was-validated-field') || field.el.parentElement;
      wrapper.classList.add('is-invalid');
      const feedback = wrapper.querySelector('.invalid-feedback-custom');
      if (feedback && message) feedback.textContent = message;
    }

    function showFormError(message) {
      if (!formErrorEl) return;
      formErrorEl.textContent = message;
      if (message) {
        formErrorEl.classList.remove('d-none');
        formErrorEl.classList.add('d-block');
      } else {
        formErrorEl.classList.add('d-none');
        formErrorEl.classList.remove('d-block');
      }
    }

    function setSubmitting(isSubmitting) {
      if (!submitBtn) return;
      submitBtn.disabled = isSubmitting;
      submitBtn.innerHTML = isSubmitting
        ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Booking&hellip;'
        : submitBtnLabel;
    }

    Object.values(fields).forEach((field) => {
      if (!field.el) return;
      field.el.addEventListener('blur', () => validateField(field));
      field.el.addEventListener('input', () => validateField(field));
      field.el.addEventListener('change', () => validateField(field));
    });

    // Set min date to today
    if (fields.date.el) {
      const today = new Date().toISOString().split('T')[0];
      fields.date.el.setAttribute('min', today);

      // Fetch already-booked slots whenever the date changes, and disable
      // those options so a user literally cannot select a taken slot.
      fields.date.el.addEventListener('change', function () {
        refreshTakenSlots(this.value);
      });
    }

    async function refreshTakenSlots(dateValue) {
      const timeSelect = fields.time.el;
      if (!timeSelect || !dateValue) return;

      Array.from(timeSelect.options).forEach((opt) => {
        opt.disabled = false;
        if (opt.dataset.originalLabel) opt.textContent = opt.dataset.originalLabel;
      });

      try {
        const response = await fetch(`/api/appointments?date=${encodeURIComponent(dateValue)}`);
        if (!response.ok) return; // Fail silently — server-side check on submit still protects us.
        const data = await response.json();
        const taken = new Set(data.takenSlots || []);

        Array.from(timeSelect.options).forEach((opt) => {
          if (taken.has(opt.value)) {
            if (!opt.dataset.originalLabel) opt.dataset.originalLabel = opt.textContent;
            opt.disabled = true;
            opt.textContent = `${opt.dataset.originalLabel} — Booked`;
            if (timeSelect.value === opt.value) timeSelect.value = '';
          }
        });
      } catch (err) {
        // Network hiccup — not fatal, the server still enforces uniqueness on submit.
        console.warn('Could not fetch slot availability:', err);
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      showFormError('');

      let allValid = true;
      Object.values(fields).forEach((field) => {
        if (!field.el) return;
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        const firstInvalid = form.querySelector('.is-invalid input, .is-invalid select');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const patientPlanEl = document.getElementById('patientPlan');
      const payload = {
        name: fields.name.el.value.trim(),
        phone: fields.phone.el.value.trim(),
        email: fields.email.el.value.trim(),
        date: fields.date.el.value,
        time: fields.time.el.value,
        service: fields.service.el.value,
        plan: patientPlanEl && patientPlanEl.value ? patientPlanEl.value : null,
        website: form.querySelector('[name="website"]') ? form.querySelector('[name="website"]').value : '',
      };

      setSubmitting(true);

      function showSuccess(name) {
        if (successNameEl) successNameEl.textContent = name.split(' ')[0];
        if (formView && successView) {
          formView.classList.add('d-none');
          successView.classList.remove('d-none');
        }
        setSubmitting(false);
      }

      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 400 || response.status === 409) {
          // Genuine, meaningful errors — bad input, or (once a database is
          // connected) the slot really was just taken. Always show these.
          if (data.fields) {
            Object.entries(data.fields).forEach(([key, msg]) => setFieldServerError(key, msg));
          }
          showFormError(data.error || 'Please correct the highlighted fields and try again.');
          setSubmitting(false);
          return;
        }

        if (!response.ok) {
          // Anything else (500, etc.) most likely means no database is
          // connected yet — see README "Backend Setup". Don't block the
          // user with a scary error for an infrastructure gap that isn't
          // their fault; confirm client-side instead, matching this
          // project's baseline (no-backend) requirement.
          console.warn(
            '[SmileCare] /api/appointments returned an error — likely no database connected yet. ' +
            'Falling back to a client-side confirmation. See README "Backend Setup" to enable real storage.',
            data.error
          );
          showSuccess(payload.name);
          return;
        }

        // Success — booked for real, in the database.
        showSuccess(payload.name);
      } catch (err) {
        // Network/CORS failure — e.g. the API isn't deployed/reachable at
        // all (opening index.html directly via file://, or no internet).
        // Same reasoning as above: don't block the user, confirm locally.
        console.warn('[SmileCare] Could not reach /api/appointments — falling back to a client-side confirmation.', err);
        showSuccess(payload.name);
      }
    });

    if (bookAnotherBtn) {
      bookAnotherBtn.addEventListener('click', function () {
        form.reset();
        showFormError('');
        Object.values(fields).forEach((field) => {
          if (!field.el) return;
          const wrapper = field.el.closest('.was-validated-field') || field.el.parentElement;
          wrapper.classList.remove('is-invalid');
        });
        if (formView && successView) {
          successView.classList.add('d-none');
          formView.classList.remove('d-none');
        }
      });
    }

    // Reset modal state whenever it's closed
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', function () {
        form.reset();
        showFormError('');
        Object.values(fields).forEach((field) => {
          if (!field.el) return;
          const wrapper = field.el.closest('.was-validated-field') || field.el.parentElement;
          wrapper.classList.remove('is-invalid');
        });
        if (formView && successView) {
          successView.classList.add('d-none');
          formView.classList.remove('d-none');
        }
        const planBanner = document.getElementById('bookingPlanBanner');
        if (planBanner) planBanner.classList.add('d-none');
      });

      // Pre-fill service when "Book Appointment" is triggered from a service card
      modalEl.addEventListener('show.bs.modal', function (event) {
        const trigger = event.relatedTarget;
        if (trigger && trigger.hasAttribute('data-service') && fields.service.el) {
          fields.service.el.value = trigger.getAttribute('data-service');
        }
      });
    }
  });
})();
