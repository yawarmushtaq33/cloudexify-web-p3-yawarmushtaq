/**
 * db/init.js
 * Runs schema.sql against the Postgres database configured in your
 * environment (POSTGRES_URL — auto-set by the Vercel Postgres/Neon
 * integration, or supplied manually for local development).
 *
 * Usage:
 *   npm run db:init
 */
const fs = require('fs');
const path = require('path');
const { sql } = require('@vercel/postgres');

async function main() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  if (!process.env.POSTGRES_URL) {
    console.error(
      '\n✖ POSTGRES_URL is not set.\n' +
      '  Run `vercel env pull .env.development.local` after linking a\n' +
      '  Postgres database in your Vercel project, or set POSTGRES_URL\n' +
      '  manually in a .env file before running this script.\n'
    );
    process.exit(1);
  }

  console.log('→ Connecting to Postgres and applying schema.sql ...');

  try {
    // schema.sql contains multiple statements; @vercel/postgres's sql tag
    // executes one statement at a time, so split on statement boundaries.
    const statements = schema
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sql.query(statement);
    }

    console.log('✔ Schema applied successfully. Tables ready: appointments, subscribers.');
    process.exit(0);
  } catch (err) {
    console.error('✖ Failed to apply schema:', err.message);
    process.exit(1);
  }
}

main();
