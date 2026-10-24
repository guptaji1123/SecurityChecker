# 5 Minute Security Check

Upload a ZIP of your project and find leaked secrets (API keys, passwords, private keys, `.env` files) in seconds. Results show a masked preview of each finding, why it is risky, and how to fix it.

- Frontend: <https://securitychecker-frontend.onrender.com>
- Backend: <https://securitychecker-backend.onrender.com>

## Privacy

- Your ZIP is unpacked in a temporary folder and deleted as soon as the scan ends, including when the scan fails.
- The real secret value is never saved, logged, or sent to the browser. You only see a masked preview such as `AKIA************`.
- Only known patterns and random-looking values are detected. A clean result is **not** a guarantee that your project is safe.

## What it detects

- 20 content rules: AWS, GitHub, Stripe, Razorpay, Google, Slack, SendGrid, Twilio, npm, OpenAI, Anthropic, Telegram, Azure, database URLs, JWTs, private key blocks, and more.
- A generic rule for random-looking values assigned to names like `secret`, `token`, `password` or `api_key`.
- Risky file names: `.env`, `*.pem`, `*.key`, `id_rsa`, `.npmrc`, `credentials.json`, `terraform.tfstate`, and more.
- Findings are rated critical, high, medium or low, and show an explanation and a fix.

## Tech stack

| Part     | Tools                                                             |
|----------|-------------------------------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router                      |
| Backend  | Node.js, Express 5, Mongoose, multer, yauzl, helmet, cors, morgan |
| Database | MongoDB (Atlas)                                                   |

## Project structure

```
SecurityChecker/
  BACKEND/     Express API and the scanner (see BACKEND/BACKEND.md)
  FRONTEND/    React app
  docs/        API contract and rules list
```

## Run it locally

You need Node.js 20 or newer and a MongoDB connection string (a free Atlas cluster works).

**Backend**

```bash
cd BACKEND
npm install
cp .env.example .env      # then fill in MONGO_URI
npm run dev               # http://localhost:5000
```

**Frontend**

```bash
cd FRONTEND
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

### Environment variables

Backend (`BACKEND/.env`)

| Name            | Example                 | Meaning                               |
| --------------- | ----------------------- | ------------------------------------- |
| `PORT`          | `5000`                  | Server port                           |
| `MONGO_URI`     | `mongodb+srv://...`     | Database connection string (required) |
| `CLIENT_URL`    | `http://localhost:5173` | Frontend address allowed by CORS      |
| `MAX_UPLOAD_MB` | `50`                    | Maximum ZIP size                      |
| `NODE_ENV`      | `development`           | Set to `production` when deployed     |

Frontend (`FRONTEND/.env`)

| Name                 | Example                 | Meaning                                                                        |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `VITE_API_URL`       | `http://localhost:5000` | Backend address                                                                |
| `VITE_USE_MOCK`      | `false`                 | `true` uses built-in fake data, so you can work without the backend            |
| `VITE_MAX_UPLOAD_MB` | `50`                    | Upload size shown and checked in the browser (keep equal to the backend value) |

## How to use it

1. Open the app and go to **Scan**.
2. Zip your project. Leave out `node_modules` and `.git` to keep the ZIP small and the scan fast.
3. Drop the ZIP on the page.
4. Open the report, then click a finding to see why it is risky and how to fix it.

If a secret was ever pushed to GitHub, treat it as leaked: rotate the key, remove it from the code, and clean the Git history.

## API

| Method | Path                      | Purpose                                         |
| ------ | ------------------------- | ----------------------------------------------- |
| GET    | `/api/health`             | Health check                                    |
| POST   | `/api/scans`              | Upload a ZIP (form-data key `file`) and scan it |
| GET    | `/api/scans/:id`          | Scan status and counts                          |
| GET    | `/api/scans/:id/findings` | Masked findings, sorted by severity             |

Full details are in `BACKEND/BACKEND.md` and `docs/API_CONTRACT.md`.

## Limits

- Maximum ZIP size is 50 MB by default. The unzipped size limit is 200 MB.
- Up to 5,000 files per ZIP, folders up to 15 levels deep.
- Files over 1 MB and binary files are skipped.
- A scan stops after 60 seconds.
- The report shows at most 500 findings. The counts always cover all findings.

## Tests

```bash
cd FRONTEND && npm run lint && npm run build
cd BACKEND && python3 tests/generateScanFixtures.py
cd BACKEND && node tests/scanFolder.js tests/fixtures/generated/all-rules.zip
```

## Roadmap

- Phase 3: accounts, GitHub URL scanning, background jobs, and ignore/resolve for findings.

## Contributing

Never commit real secrets. Build any fake test keys in code instead of writing them as plain text, because GitHub push protection will block realistic-looking keys.
