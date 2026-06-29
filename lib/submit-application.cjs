const { Pool } = require('pg');

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TO_EMAIL = 'faith.amanata@tractrac.co';
const FROM_EMAIL = 'tractracnigeria@gmail.com';

const AGE_RANGES = new Set(['16 to 18', '18 to 27', '27 to 35']);
const NIGERIAN_STATES = new Set([
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nassarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeSubmitPayload(body) {
  if (body.full_name) return body;

  const declared = body.declaration === true;
  return {
    full_name: body.fullName,
    email: body.email,
    phone: body.phone,
    age_range: body.age_range ?? body.age,
    gender: body.gender,
    state: body.state,
    interests: body.interests ?? body.interest ?? [],
    leadership: body.leadership || null,
    agreed_terms: body.agreed_terms ?? declared,
    agreed_voluntary: body.agreed_voluntary ?? declared,
    agreed_code_of_conduct: body.agreed_code_of_conduct ?? declared,
    agreed_data_consent: body.agreed_data_consent ?? declared,
    agreed_accuracy: body.agreed_accuracy ?? declared,
  };
}

function validateApplication(body) {
  const errors = [];
  if (!body.full_name?.trim()) errors.push('full_name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '').trim())) {
    errors.push('email must be a valid email address');
  }
  if (!body.phone?.trim()) errors.push('phone is required');
  if (!AGE_RANGES.has(body.age_range)) errors.push('age_range is invalid');
  if (!NIGERIAN_STATES.has(body.state)) errors.push('state is invalid');
  if (!Array.isArray(body.interests) || body.interests.length === 0) {
    errors.push('at least one interest is required');
  }
  for (const field of [
    'agreed_terms',
    'agreed_voluntary',
    'agreed_code_of_conduct',
    'agreed_data_consent',
    'agreed_accuracy',
  ]) {
    if (body[field] !== true) errors.push(`${field} must be accepted`);
  }
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      age_range: body.age_range,
      gender: body.gender?.trim() || null,
      state: body.state,
      leadership: body.leadership || null,
      interests: body.interests.map((i) => String(i).trim()).filter(Boolean),
      agreed_terms: true,
      agreed_voluntary: true,
      agreed_code_of_conduct: true,
      agreed_data_consent: true,
      agreed_accuracy: true,
    },
  };
}

async function persistApplication(data) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { ok: false, skipped: true, reason: 'DATABASE_URL is not configured' };
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const interestResult = await client.query(
      'SELECT id, label FROM interest_options WHERE label = ANY($1::text[])',
      [data.interests],
    );

    if (interestResult.rows.length !== data.interests.length) {
      await client.query('ROLLBACK');
      return { ok: false, status: 400, error: 'Validation failed', details: ['unknown interest option(s)'] };
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
      id: applicationId,
      created_at: applicationResult.rows[0].created_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to save application:', err);
    return { ok: false, status: 500, error: 'Failed to save application' };
  } finally {
    client.release();
    await pool.end();
  }
}

async function sendApplicationEmail(data) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: 'BREVO_API_KEY is not configured' };
  }

  const interests = Array.isArray(data.interests)
    ? data.interests.join(', ')
    : Array.isArray(data.interest)
      ? data.interest.join(', ')
      : '';

  const row = (label, value) =>
    `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${label}</td><td style="padding:6px 12px">${esc(value)}</td></tr>`;

  const htmlContent = `
    <h2>New YPiM Membership Application</h2>
    <table cellpadding="0" cellspacing="0">
      ${row('Full Name', data.full_name ?? data.fullName)}
      ${row('Email', data.email)}
      ${row('Phone', data.phone)}
      ${row('Age Range', data.age_range ?? data.age)}
      ${row('Gender', data.gender)}
      ${row('State', data.state)}
      ${row('Interests', interests)}
      ${row('Interested in Leadership', data.leadership)}
      ${row('Accepted Declaration', (data.agreed_terms ?? data.declaration) ? 'Yes' : 'No')}
    </table>
  `;

  const brevoRes = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'YPiM Apply Form', email: FROM_EMAIL },
      to: [{ email: TO_EMAIL, name: 'Faith Amanata' }],
      subject: `New YPiM Membership Application - ${data.full_name ?? data.fullName ?? 'Unknown'}`,
      htmlContent,
    }),
  });

  if (!brevoRes.ok) {
    const errText = await brevoRes.text();
    console.error('Brevo error:', errText);
    return { sent: false, reason: 'Failed to send email' };
  }

  return { sent: true };
}

async function handleSubmitApplication(rawBody) {
  const normalized = normalizeSubmitPayload(rawBody);
  const validation = validateApplication(normalized);
  if (!validation.ok) {
    return { status: 400, body: { error: 'Validation failed', details: validation.errors } };
  }

  const saveResult = await persistApplication(validation.data);
  if (saveResult.ok === false && !saveResult.skipped) {
    return {
      status: saveResult.status || 500,
      body: { error: saveResult.error, details: saveResult.details },
    };
  }

  const emailResult = await sendApplicationEmail(normalized);

  if (saveResult.skipped && !emailResult.sent) {
    return {
      status: 500,
      body: { error: 'Submission service is not configured (set DATABASE_URL and/or BREVO_API_KEY)' },
    };
  }

  if (!emailResult.sent) {
    console.warn('Application processed but email not sent:', emailResult.reason);
  }

  return {
    status: 200,
    body: {
      ok: true,
      id: saveResult.id,
      created_at: saveResult.created_at,
      saved_to_database: Boolean(saveResult.ok),
      email_sent: emailResult.sent,
    },
  };
}

module.exports = { handleSubmitApplication, normalizeSubmitPayload };
