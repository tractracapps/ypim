export function normalizeSubmitPayload(body) {
  if (body.full_name) {
    return body;
  }

  const interests = body.interests ?? body.interest ?? [];
  const declared = body.declaration === true;

  return {
    full_name: body.fullName,
    email: body.email,
    phone: body.phone,
    age_range: body.age_range ?? body.age,
    gender: body.gender,
    state: body.state,
    interests,
    leadership: body.leadership || null,
    agreed_terms: body.agreed_terms ?? declared,
    agreed_voluntary: body.agreed_voluntary ?? declared,
    agreed_code_of_conduct: body.agreed_code_of_conduct ?? declared,
    agreed_data_consent: body.agreed_data_consent ?? declared,
    agreed_accuracy: body.agreed_accuracy ?? declared,
  };
}
