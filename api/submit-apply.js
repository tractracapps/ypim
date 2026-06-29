const { handleSubmitApplication } = require('../lib/submit-application.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const result = await handleSubmitApplication(req.body || {});
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
