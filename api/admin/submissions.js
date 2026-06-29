const { Pool } = require('pg');

const LIST_QUERY = `
  SELECT
    a.id, a.full_name, a.email, a.phone, a.age_range, a.gender, a.state, a.leadership,
    a.agreed_terms, a.agreed_voluntary, a.agreed_code_of_conduct, a.agreed_data_consent, a.agreed_accuracy,
    a.created_at,
    COALESCE(array_agg(io.label) FILTER (WHERE io.label IS NOT NULL), '{}') AS interests
  FROM applications a
  LEFT JOIN application_interests ai ON ai.application_id = a.id
  LEFT JOIN interest_options io ON io.id = ai.interest_id
  GROUP BY a.id
  ORDER BY a.created_at DESC
`;

function isAuthorized(req) {
  const key = req.headers['x-admin-key'] || req.query.key;
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

async function fetchSubmissions() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(LIST_QUERY);
    return rows;
  } finally {
    await pool.end();
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    const submissions = await fetchSubmissions();
    res.status(200).json({ submissions });
  } catch (err) {
    console.error('DB read error:', err);
    res.status(500).send('Server error');
  }
};
