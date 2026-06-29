const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TO_EMAIL = 'faith.amanata@tractrac.co';
const FROM_EMAIL = 'tractracnigeria@gmail.com';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEmailHtml(data) {
  const row = (label, value) =>
    `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${label}</td><td style="padding:6px 12px">${esc(value)}</td></tr>`;
  return `
    <h2>New YPiM Membership Application</h2>
    <table cellpadding="0" cellspacing="0">
      ${row('Full Name', data.fullName)}
      ${row('Email', data.email)}
      ${row('Phone', data.phone)}
      ${row('Age Range', data.age)}
      ${row('Gender', data.gender)}
      ${row('State', data.state)}
      ${row('Interests', Array.isArray(data.interest) ? data.interest.join(', ') : data.interest)}
      ${row('Interested in Leadership', data.leadership)}
      ${row('Accepted Declaration', data.declaration ? 'Yes' : 'No')}
    </table>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    res.status(500).send('Email service is not configured');
    return;
  }

  const data = req.body || {};

  try {
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
        subject: `New YPiM Membership Application - ${data.fullName || 'Unknown'}`,
        htmlContent: buildEmailHtml(data),
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error('Brevo error:', errText);
      res.status(502).send('Failed to send email');
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
