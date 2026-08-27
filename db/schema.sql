-- ============================================================================
-- SmileCare Dental — Database Schema (Postgres)
-- ============================================================================
-- Run once against your Vercel Postgres (Neon) database, either via:
--   npm run db:init
-- or by pasting this file into the Vercel Postgres / Neon SQL console.
--
-- Design notes:
--   • UNIQUE (appointment_date, appointment_time) makes double-booking a slot
--     IMPOSSIBLE at the database level — not just checked in application code.
--     Two simultaneous requests for the same slot will race at the DB, and
--     Postgres guarantees only one of them succeeds (23505 unique_violation).
--   • UNIQUE (email) on subscribers makes duplicate newsletter signups
--     impossible for the same reason.
--   • CHECK constraints reject obviously-invalid data before it's ever stored.
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id                SERIAL PRIMARY KEY,
  patient_name      TEXT NOT NULL CHECK (char_length(trim(patient_name)) >= 2),
  phone             TEXT NOT NULL CHECK (char_length(trim(phone)) >= 7),
  email             TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  appointment_date  DATE NOT NULL,
  appointment_time  TEXT NOT NULL,
  service           TEXT NOT NULL,
  plan              TEXT CHECK (plan IS NULL OR plan IN ('basic', 'standard', 'premium')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_appointment_slot UNIQUE (appointment_date, appointment_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments (email);

-- Migration safety net: if this schema was already applied before the
-- `plan` column existed, CREATE TABLE IF NOT EXISTS above is a no-op on
-- the existing table, so add it explicitly here too.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_plan_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_plan_check
  CHECK (plan IS NULL OR plan IN ('basic', 'standard', 'premium'));

CREATE TABLE IF NOT EXISTS subscribers (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,

  CONSTRAINT unique_subscriber_email UNIQUE (email)
);

-- Keep `updated_at` accurate automatically whenever an appointment row changes
-- (e.g. status updated from 'pending' to 'confirmed' by clinic staff).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
