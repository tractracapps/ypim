export const up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('applications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    full_name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(50)', notNull: true },
    age_range: { type: 'varchar(20)', notNull: true },
    gender: { type: 'varchar(30)' },
    state: { type: 'varchar(100)', notNull: true },
    leadership: { type: 'varchar(10)' },
    agreed_terms: { type: 'boolean', notNull: true, default: false },
    agreed_voluntary: { type: 'boolean', notNull: true, default: false },
    agreed_code_of_conduct: { type: 'boolean', notNull: true, default: false },
    agreed_data_consent: { type: 'boolean', notNull: true, default: false },
    agreed_accuracy: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('applications', 'email');
  pgm.createIndex('applications', 'created_at');

  pgm.createTable('interest_options', {
    id: 'id',
    label: { type: 'varchar(255)', notNull: true, unique: true },
  });

  pgm.createTable('application_interests', {
    application_id: {
      type: 'uuid',
      notNull: true,
      references: 'applications',
      onDelete: 'CASCADE',
    },
    interest_id: {
      type: 'integer',
      notNull: true,
      references: 'interest_options',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('application_interests', 'application_interests_pkey', {
    primaryKey: ['application_id', 'interest_id'],
  });
};

export const down = (pgm) => {
  pgm.dropTable('application_interests');
  pgm.dropTable('interest_options');
  pgm.dropTable('applications');
};
