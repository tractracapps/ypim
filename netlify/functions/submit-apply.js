const { handleSubmitApplication } = require('../../lib/submit-application.cjs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  try {
    const result = await handleSubmitApplication(data);
    return {
      statusCode: result.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.body),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};
