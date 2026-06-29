# YPiM Backend

Express API and PostgreSQL storage for YPiM membership applications.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a remote `DATABASE_URL`)

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Postgres credentials

npm install
npm run setup    # creates database + runs migrations
npm run dev      # http://localhost:3000
```

Open the application form at [http://localhost:3000/Apply.html](http://localhost:3000/Apply.html).

## API

### `POST /api/applications`

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "08001234567",
  "age_range": "18 to 27",
  "gender": "Female",
  "state": "Lagos",
  "interests": ["Skills Development & Training", "Operator Training"],
  "leadership": "yes",
  "agreed_terms": true,
  "agreed_voluntary": true,
  "agreed_code_of_conduct": true,
  "agreed_data_consent": true,
  "agreed_accuracy": true
}
```

### `GET /api/applications/health`

Database connectivity check.

## Migrations

```bash
npm run migrate          # apply pending migrations
npm run migrate:down     # rollback last migration
npm run migrate:create   # create a new migration file
```
