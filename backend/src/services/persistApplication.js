import { pool } from '../db.js';
import { validateApplication } from '../validation.js';
import { normalizeSubmitPayload } from '../lib/normalizeApplication.js';

export async function persistApplication(rawBody) {
  const normalized = normalizeSubmitPayload(rawBody);
  const validation = validateApplication(normalized);
  if (!validation.ok) {
    return { ok: false, status: 400, error: 'Validation failed', details: validation.errors };
  }

  const { data } = validation;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const interestResult = await client.query(
      'SELECT id, label FROM interest_options WHERE label = ANY($1::text[])',
      [data.interests],
    );

    if (interestResult.rows.length !== data.interests.length) {
      const found = new Set(interestResult.rows.map((row) => row.label));
      const missing = data.interests.filter((label) => !found.has(label));
      await client.query('ROLLBACK');
      return {
        ok: false,
        status: 400,
        error: 'Validation failed',
        details: [`unknown interest option(s): ${missing.join(', ')}`],
      };
    }

    const applicationResult = await client.query(
      `INSERT INTO applications (
        full_name, email, phone, age_range, gender, state, leadership,
        agreed_terms, agreed_voluntary, agreed_code_of_conduct,
        agreed_data_consent, agreed_accuracy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at`,
      [
        data.full_name,
        data.email,
        data.phone,
        data.age_range,
        data.gender,
        data.state,
        data.leadership,
        data.agreed_terms,
        data.agreed_voluntary,
        data.agreed_code_of_conduct,
        data.agreed_data_consent,
        data.agreed_accuracy,
      ],
    );

    const applicationId = applicationResult.rows[0].id;

    for (const row of interestResult.rows) {
      await client.query(
        'INSERT INTO application_interests (application_id, interest_id) VALUES ($1, $2)',
        [applicationId, row.id],
      );
    }

    await client.query('COMMIT');

    return {
      ok: true,
      status: 201,
      id: applicationId,
      created_at: applicationResult.rows[0].created_at,
      message: 'Application submitted successfully',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to save application:', err);
    return { ok: false, status: 500, error: 'Failed to save application' };
  } finally {
    client.release();
  }
}
