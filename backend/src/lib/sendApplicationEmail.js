const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TO_EMAIL = 'faith.amanata@tractrac.co';
const FROM_EMAIL = 'tractracnigeria@gmail.com';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEmailHtml(data) {
  const row = (label, value) =>
    `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${label}</td><td style="padding:6px 12px">${esc(value)}</td></tr>`;
  const interests = Array.isArray(data.interests)
    ? data.interests.join(', ')
    : Array.isArray(data.interest)
      ? data.interest.join(', ')
      : data.interests ?? data.interest ?? '';

  return `
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
}

export async function sendApplicationEmail(data) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: 'BREVO_API_KEY is not configured' };
  }

  const name = data.full_name ?? data.fullName ?? 'Unknown';
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
      subject: `New YPiM Membership Application - ${name}`,
      htmlContent: buildEmailHtml(data),
    }),
  });

  if (!brevoRes.ok) {
    const errText = await brevoRes.text();
    console.error('Brevo error:', errText);
    return { sent: false, reason: 'Failed to send email' };
  }

  return { sent: true };
}
