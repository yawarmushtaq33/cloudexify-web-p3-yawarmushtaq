/**
 * api/_lib/validate.js
 * Shared server-side validation for all API routes.
 *
 * Server-side validation is mandatory and independent from client-side
 * validation in modal.js / subscribe.js — the client checks exist purely
 * for UX; these checks are what actually protect the database. Never trust
 * a request body just because the client-side form "should" have validated it.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;
const TIME_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'];
const SERVICES = [
  'general-cleaning',
  'teeth-whitening',
  'braces-aligners',
  'root-canal',
  'dental-implants',
  'cosmetic-dentistry',
];
const PLANS = ['basic', 'standard', 'premium'];

function isNonEmptyString(v, minLen = 1, maxLen = 200) {
  return typeof v === 'string' && v.trim().length >= minLen && v.trim().length <= maxLen;
}

function isValidEmail(v) {
  return isNonEmptyString(v, 3, 254) && EMAIL_RE.test(v.trim());
}

function isValidPhone(v) {
  return isNonEmptyString(v, 7, 20) && PHONE_RE.test(v.trim());
}

function isValidFutureDate(v) {
  if (!isNonEmptyString(v, 8, 10)) return false;
  const date = new Date(v + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function isValidTimeSlot(v) {
  return TIME_SLOTS.includes(v);
}

function isValidService(v) {
  return SERVICES.includes(v);
}

function isValidPlan(v) {
  // Optional field: a direct "Book Appointment" (no pricing plan chosen)
  // legitimately has no plan at all.
  if (v === null || v === undefined || v === '') return true;
  return PLANS.includes(v);
}

/**
 * Validates an appointment booking payload.
 * Returns { valid: boolean, errors: { field: message } }
 */
function validateAppointment(body) {
  const errors = {};
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _root: 'Request body is missing or malformed.' } };
  }

  if (!isNonEmptyString(body.name, 2, 120)) {
    errors.name = 'Please provide a full name (2–120 characters).';
  }
  if (!isValidPhone(body.phone)) {
    errors.phone = 'Please provide a valid phone number.';
  }
  if (!isValidEmail(body.email)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (!isValidFutureDate(body.date)) {
    errors.date = 'Please choose today or a future date.';
  }
  if (!isValidTimeSlot(body.time)) {
    errors.time = 'Please select a valid appointment time.';
  }
  if (!isValidService(body.service)) {
    errors.service = 'Please select a valid service.';
  }
  if (!isValidPlan(body.plan)) {
    errors.plan = 'Please select a valid plan.';
  }
  // Honeypot: real users never fill this hidden field. Bots often do.
  if (body.website && String(body.website).trim() !== '') {
    errors._root = 'Spam detected.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates a newsletter subscription payload.
 */
function validateSubscriber(body) {
  const errors = {};
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _root: 'Request body is missing or malformed.' } };
  }
  if (!isValidEmail(body.email)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (body.website && String(body.website).trim() !== '') {
    errors._root = 'Spam detected.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  TIME_SLOTS,
  SERVICES,
  PLANS,
  isValidEmail,
  isValidPhone,
  isValidFutureDate,
  isValidTimeSlot,
  isValidService,
  isValidPlan,
  validateAppointment,
  validateSubscriber,
};
