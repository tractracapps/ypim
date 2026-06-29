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

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
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

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).send('DATABASE_URL is not configured');
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const { rows } = await pool.query(LIST_QUERY);

    const headers = [
      'ID', 'Full Name', 'Email', 'Phone', 'Age Range', 'Gender', 'State', 'Interests',
      'Leadership Interest', 'Agreed Terms', 'Agreed Voluntary', 'Agreed Code Of Conduct',
      'Agreed Data Consent', 'Agreed Accuracy', 'Submitted At',
    ];
    const lines = [headers.join(',')];

    for (const r of rows) {
      lines.push([
        r.id,
        csvEscape(r.full_name),
        csvEscape(r.email),
        csvEscape(r.phone),
        csvEscape(r.age_range),
        csvEscape(r.gender),
        csvEscape(r.state),
        csvEscape(Array.isArray(r.interests) ? r.interests.join('; ') : r.interests),
        csvEscape(r.leadership),
        r.agreed_terms ? 'Yes' : 'No',
        r.agreed_voluntary ? 'Yes' : 'No',
        r.agreed_code_of_conduct ? 'Yes' : 'No',
        r.agreed_data_consent ? 'Yes' : 'No',
        r.agreed_accuracy ? 'Yes' : 'No',
        csvEscape(new Date(r.created_at).toISOString()),
      ].join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ypim-applications.csv"');
    res.status(200).send(csv);
  } catch (err) {
    console.error('DB export error:', err);
    res.status(500).send('Server error');
  } finally {
    await pool.end();
  }
};
