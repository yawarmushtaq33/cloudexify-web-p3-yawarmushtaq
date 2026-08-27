/**
 * api/appointments.js
 * Vercel Serverless Function — handles appointment booking.
 *
 *   POST /api/appointments
 *     Creates a new appointment. Rejects with 409 if the exact
 *     (date, time) slot is already taken — enforced by a UNIQUE
 *     constraint in Postgres, so this is race-condition-safe even
 *     under concurrent requests, not just checked in application code.
 *
 *   GET /api/appointments?date=YYYY-MM-DD
 *     Returns the list of already-booked times for that date, so the
 *     frontend can grey out unavailable slots before the user even submits.
 */

const { sql } = require('@vercel/postgres');
const { validateAppointment, isValidFutureDate } = require('./_lib/validate');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      return await handleCreate(req, res);
    }
    if (req.method === 'GET') {
      return await handleListTakenSlots(req, res);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    // Catch-all safety net: never leak internals, always log server-side.
    console.error('[api/appointments] Unhandled error:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' });
  }
};

async function handleCreate(req, res) {
  const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
  const { valid, errors } = validateAppointment(body || {});

  if (!valid) {
    return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
  }

  const { name, phone, email, date, time, service } = body;
  const plan = body.plan || null; // normalize '' / undefined to null for the DB

  try {
    const result = await sql`
      INSERT INTO appointments (patient_name, phone, email, appointment_date, appointment_time, service, plan)
      VALUES (${name.trim()}, ${phone.trim()}, ${email.trim().toLowerCase()}, ${date}, ${time}, ${service}, ${plan})
      RETURNING id, patient_name, appointment_date, appointment_time, service, plan, status, created_at;
    `;

    return res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment: result.rows[0],
    });
  } catch (err) {
    // Postgres unique_violation — the requested slot was just taken,
    // possibly by a concurrent request. This is the expected, safe path
    // for a double-booking attempt, not a bug.
    if (err && err.code === '23505') {
      return res.status(409).json({
        error: 'That time slot was just booked by someone else. Please pick another time.',
        fields: { time: 'This slot is no longer available.' },
      });
    }
    console.error('[api/appointments] Insert failed:', err);
    return res.status(500).json({ error: 'Could not save your appointment. Please try again.' });
  }
}

async function handleListTakenSlots(req, res) {
  const { date } = req.query || {};

  if (!isValidFutureDate(date)) {
    return res.status(400).json({ error: 'A valid date query parameter (YYYY-MM-DD, today or later) is required.' });
  }

  const result = await sql`
    SELECT appointment_time
    FROM appointments
    WHERE appointment_date = ${date}
      AND status != 'cancelled';
  `;

  return res.status(200).json({
    date,
    takenSlots: result.rows.map((r) => r.appointment_time),
  });
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
