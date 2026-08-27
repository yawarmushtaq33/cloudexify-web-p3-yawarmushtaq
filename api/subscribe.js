/**
 * api/subscribe.js
 * Vercel Serverless Function — newsletter subscription.
 *
 *   POST /api/subscribe
 *     Adds an email to the subscribers list. A UNIQUE constraint on
 *     `email` in Postgres makes duplicate signups impossible at the data
 *     layer — if someone subscribes twice (even from two tabs at once),
 *     only one row can ever exist for that address.
 */

const { sql } = require('@vercel/postgres');
const { validateSubscriber } = require('./_lib/validate');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
    const { valid, errors } = validateSubscriber(body || {});

    if (!valid) {
      return res.status(400).json({ error: 'Please provide a valid email address.', fields: errors });
    }

    const email = body.email.trim().toLowerCase();

    try {
      const result = await sql`
        INSERT INTO subscribers (email)
        VALUES (${email})
        RETURNING id, email, subscribed_at;
      `;
      return res.status(201).json({
        message: 'You are subscribed! Watch your inbox for seasonal tips and clinic updates.',
        subscriber: result.rows[0],
      });
    } catch (err) {
      if (err && err.code === '23505') {
        // Not an error from the user's point of view — treat as idempotent.
        return res.status(409).json({
          error: "You're already subscribed with this email.",
          fields: { email: 'Already subscribed.' },
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('[api/subscribe] Unhandled error:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' });
  }
};

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
