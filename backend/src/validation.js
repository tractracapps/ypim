const AGE_RANGES = new Set(['16 to 18', '18 to 27', '27 to 35']);
const GENDERS = new Set(['Male', 'Female', 'Prefer not to say', '']);
const LEADERSHIP = new Set(['yes', 'no', null, '']);

const NIGERIAN_STATES = new Set([
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nassarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateApplication(body) {
  const errors = [];

  if (!isNonEmptyString(body.full_name)) errors.push('full_name is required');
  if (!isEmail(body.email)) errors.push('email must be a valid email address');
  if (!isNonEmptyString(body.phone)) errors.push('phone is required');
  if (!AGE_RANGES.has(body.age_range)) errors.push('age_range is invalid');
  if (!NIGERIAN_STATES.has(body.state)) errors.push('state is invalid');

  if (body.gender != null && body.gender !== '' && !GENDERS.has(body.gender)) {
    errors.push('gender is invalid');
  }

  if (body.leadership != null && body.leadership !== '' && !LEADERSHIP.has(body.leadership)) {
    errors.push('leadership must be yes or no');
  }

  if (!Array.isArray(body.interests) || body.interests.length === 0) {
    errors.push('at least one interest is required');
  }

  const agreements = [
    'agreed_terms',
    'agreed_voluntary',
    'agreed_code_of_conduct',
    'agreed_data_consent',
    'agreed_accuracy',
  ];

  for (const field of agreements) {
    if (body[field] !== true) errors.push(`${field} must be accepted`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

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
