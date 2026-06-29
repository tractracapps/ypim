const INTERESTS = [
  'Skills Development & Training',
  'Operator Training',
  'Employment & Business Opportunities',
  'Leadership, Advocacy & Policy Engagement',
  'Innovation & Technology in Mechanization',
  'Other',
];

export const up = (pgm) => {
  for (const label of INTERESTS) {
    pgm.sql(
      `INSERT INTO interest_options (label) VALUES ('${label.replace(/'/g, "''")}') ON CONFLICT (label) DO NOTHING`,
    );
  }
};

export const down = (pgm) => {
  pgm.sql(`DELETE FROM interest_options WHERE label IN (${INTERESTS.map((l) => `'${l.replace(/'/g, "''")}'`).join(', ')})`);
};
