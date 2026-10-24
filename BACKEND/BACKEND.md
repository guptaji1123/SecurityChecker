# SecurityChecker Backend

Express + MongoDB API that accepts a ZIP of a project, extracts it safely, scans it for leaked secrets, and returns **masked** findings. The real secret value is never stored, logged, or sent to the client.

## Run it

```bash
cd BACKEND
npm install
cp .env                  # then fill in MONGO_URI
npm run dev              # development (nodemon)
npm start                # production
```

## Environment variables

| Name            | Default        | Meaning                                                                 |
| --------------- | -------------- | ----------------------------------------------------------------------- |
| `PORT`          | `5000`         | Port the server listens on                                              |
| `MONGO_URI`     | none, required | MongoDB / Atlas connection string. The server will not start without it |
| `CLIENT_URL`    | none           | Frontend origin allowed by CORS (e.g. `http://localhost:5173`)          |
| `MAX_UPLOAD_MB` | `50`           | Maximum size of the uploaded ZIP                                        |
| `NODE_ENV`      | none           | `production` hides internal error details                               |

## Folder layout

```
server.js                      starts the server after the database connects
source/
  app.js                       helmet, cors, JSON parser, morgan, routes, error handlers
  routes/                      /api/health and /api/scans routes
  controller/                  health.js, scanController.js
  middleware/                  upload.js (multer), notFound.js, errorHandler.js
  model/                       scan.js, finding.js (Mongoose)
  utilities/                   AppError.js, safeExtract.js
  scanner/
    fileWalker.js              lists the files worth scanning
    scanFile.js                runs the rules on one file
    rules/index.js             the pattern rules
    entropy.js                 randomness and placeholder checks for the generic rule
    mask.js                    masks secrets, builds snippets, counts severities
    sensitiveFiles.js          flags risky file names (.env, .pem, ...)
    scanDirectory.js           ties it all together
```

## API

All responses use one envelope.

- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

| Method | Path                      | What it does                                                                                                   |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`             | Health check                                                                                                   |
| POST   | `/api/scans`              | Upload a ZIP (form-data, key `file`). Scans inside the request and returns the finished scan with status `201` |
| GET    | `/api/scans/:id`          | Scan info: `id`, `originalName`, `status`, `filesScanned`, `counts`, `createdAt`                               |
| GET    | `/api/scans/:id/findings` | `{ scanId, total, truncated, findings }`, sorted by severity, then file path, then line. Capped at 500         |

Scan status is one of `queued`, `scanning`, `completed`, `failed`.

A finding has: `id`, `ruleId`, `type`, `severity`, `filePath`, `line`, `maskedSnippet`, `explanation`, `fix`.

### Error codes

| Code                 | Status | When                                             |
| -------------------- | ------ | ------------------------------------------------ |
| `NO_FILE`            | 400    | No file in the request                           |
| `INVALID_ZIP`        | 400    | Not a `.zip` name, or the file is not a real ZIP |
| `UPLOAD_ERROR`       | 400    | Other upload problem                             |
| `FILE_TOO_LARGE`     | 413    | ZIP is larger than `MAX_UPLOAD_MB`               |
| `ZIP_UNSAFE_PATH`    | 400    | ZIP tries to write outside its folder (zip slip) |
| `ZIP_TOO_MANY_FILES` | 400    | More than 5,000 files                            |
| `ZIP_TOO_DEEP`       | 400    | Folders nested deeper than 15 levels             |
| `ZIP_TOO_LARGE`      | 413    | Unzipped size is over 200 MB                     |
| `SCAN_TIMEOUT`       | 408    | Scan took longer than 60 seconds                 |
| `SCAN_NOT_FOUND`     | 404    | Scan id is invalid or does not exist             |
| `NOT_FOUND`          | 404    | Unknown route                                    |
| `VALIDATION_ERROR`   | 400    | Database validation failed                       |
| `INTERNAL_ERROR`     | 500    | Anything unexpected                              |

## How a scan works

1. **Upload.** multer saves the ZIP to `os.tmpdir()/securitychecker/` under a random name. Only `.zip` names are accepted, and the file must start with the real ZIP signature.
2. **Safe extract** (`safeExtract.js`) into `os.tmpdir()/securitychecker-extracted/`.
   - Blocks zip slip paths.
   - Skips symlinks.
   - Limits: 5,000 files, 200 MB unzipped, depth 15, 20,000 entries.
   - Zip bombs are caught by counting the real bytes while streaming.
3. **Walk** (`fileWalker.js`).
   - Skips these folders: `node_modules`, `.git`, `dist`, `build`, `.next`, `vendor`, `coverage`, `__pycache__`, `.venv`.
   - Skips images, fonts, media, archives, compiled files, `.min.js`, lock files, files over 1 MB, and binary files (null byte in the first 8 KB).
   - Never follows symlinks.
   - Sensitive file names (`.env`, `*.pem`, `id_rsa`, ...) are never skipped.
4. **Scan each file** (`scanFile.js`). It reads the file line by line, skips lines over 2,000 characters, and runs every rule. A rule can have `keywords`, a quick check that must pass before the regex runs. One bad file never stops the scan.
5. **File-name findings** (`sensitiveFiles.js`). These look at the name only and use line 1 with the snippet `(file contents hidden)`.
6. **Merge, dedupe, sort** (`scanDirectory.js`).
   - If two rules match the same value on a line, the more specific rule wins. A known-format rule beats the generic rule, then higher severity wins, then the longer match.
   - A key file such as `.pem` gets one finding, not two.
   - Findings are sorted by severity, then path, then line, and capped at 500.
   - `counts` always covers all findings, even when the list is cut. `truncated` is `true` when the list was cut.
7. **Save** the findings and counts, then set the status to `completed`. On any error, the findings for that scan are removed and the status becomes `failed`.
8. **Cleanup.** The uploaded ZIP and the extracted folder are always deleted, on success and on failure.

## Rules

There are 20 content rules and 4 file-name rules.

| Rule id                            | Severity | Finds                                                                                 |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `aws-access-key`                   | critical | AWS access key id                                                                     |
| `aws-secret-key`                   | critical | AWS secret access key                                                                 |
| `github-token`                     | critical | GitHub token                                                                          |
| `stripe-live-key`                  | critical | Stripe live key                                                                       |
| `razorpay-live-key`                | critical | Razorpay live key                                                                     |
| `private-key-block`                | critical | Private key header                                                                    |
| `azure-storage-key`                | critical | Azure storage account key                                                             |
| `db-connection-url`                | critical | Database URL with user and password                                                   |
| `google-api-key`                   | high     | Google API key                                                                        |
| `slack-token`                      | high     | Slack token                                                                           |
| `sendgrid-key`                     | high     | SendGrid key                                                                          |
| `twilio-key`                       | high     | Twilio key                                                                            |
| `npm-token`                        | high     | npm token                                                                             |
| `openai-key`                       | high     | OpenAI key                                                                            |
| `anthropic-key`                    | high     | Anthropic key                                                                         |
| `telegram-bot-token`               | high     | Telegram bot token                                                                    |
| `slack-webhook`                    | medium   | Slack webhook URL                                                                     |
| `jwt-token`                        | medium   | JSON Web Token                                                                        |
| `generic-secret`                   | medium   | Random-looking value assigned to a name like `secret`, `token`, `password`, `api_key` |
| `stripe-test-key`                  | low      | Stripe test key                                                                       |
| `sensitive-env-file`               | high     | `.env`, `.env.local`, `.env.production` (not `.example`, `.sample`, `.template`)      |
| `sensitive-private-key-file`       | critical | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`      |
| `sensitive-credentials-file`       | high     | `.npmrc`, `.pypirc`, `.git-credentials`, `.htpasswd`                                  |
| `sensitive-cloud-credentials-file` | high     | `credentials.json`, `serviceAccountKey.json`, `terraform.tfstate`                     |

### The generic rule

`generic-secret` is the main source of false positives, so it is strict. A match needs all of these:

- A name containing `secret`, `token`, `password`, `passwd`, `pwd`, `api_key`, `auth` or `credential`.
- A quoted value of 16 or more characters.
- At least one letter and one digit.
- Shannon entropy of 3.5 or higher (`MIN_ENTROPY` in `entropy.js`).

It ignores:

- Placeholder words: `your`, `example`, `changeme`, `placeholder`, `xxxx`, `test`.
- Placeholder shapes: `<...>`, `${...}`, `{{...}}`.
- Values read from the environment (`process.env`, `os.environ`, `import.meta.env`).
- URLs.
- UUIDs.

### How to add a rule

1. Add an object to `source/scanner/rules/index.js`:

   ```js
   {
       id: 'my-service-key',                               // unique, kebab-case
       name: 'My Service Key',
       severity: 'high',                                   // critical | high | medium | low
       pattern: /\bmsk_[A-Za-z0-9]{32}(?![A-Za-z0-9])/g,   // must have the g flag
       keywords: ['msk_'],                                 // optional, speeds things up
       explanation: 'One or two plain sentences on why it is risky.',
       fix: 'One or two plain sentences on how to fix it.',
   }
   ```

2. Put the real secret in a named group `(?<secret>...)` if only part of the match is secret.
3. Avoid nested quantifiers such as `(a+)+` (they can freeze Node). Use bounded quantifiers.
4. Add one test string that should match and one that should not.
5. Add the rule to the table above and to `docs/RULES.md`.

## Security rules for this code

- The raw secret never leaves `scanFile.js` in memory. Everything that is stored, logged or returned uses `maskedSnippet`.
- `maskSecret` keeps at most 4 characters. Values under 8 characters become all `*`.
- Each snippet is cut to about 120 characters. Any other secret on the same line is masked too.
- Never add a field to the `Finding` model that holds the raw secret.
- Never commit realistic fake keys as plain text. Build them in code, for example `'AKI' + 'A' + '...'`.
- Never log request bodies or file contents.

## Testing

```bash
python3 tests/generateScanFixtures.py                                      # builds 3 ZIPs (git-ignored)
node tests/scanFolder.js tests/fixtures/generated/all-rules.zip            # expect 24 findings, 24 of 24 rules
node tests/scanFolder.js tests/fixtures/generated/clean-project.zip        # expect 0
node tests/scanFolder.js tests/fixtures/generated/placeholders-only.zip    # expect 0
node tests/scanFolder.js path/to/any.zip --list                            # scan a real project and list findings
```

After a Postman run, `os.tmpdir()/securitychecker` and `securitychecker-extracted` must be empty.

### Scan results

| Project                   | Files | Time        | Findings | Real | False positives                                         |
| ------------------------- | ----- | ----------- | -------- | ---- | ------------------------------------------------------- |
| all-rules.zip             | 24    | 0.03 s      | 24       | 24   | 0                                                       |
| clean-project.zip         | 5     | under 0.1 s | 0        | 0    | 0                                                       |
| placeholders-only.zip     | 3     | under 0.1 s | 0        | 0    | 0                                                       |
| Express                   | 214   | 0.22 s      | 1        | 0    | 1 (`.npmrc` with a normal setting)                      |
| React (realworld example) | 43    | 0.06 s      | 0        | 0    | 0                                                       |
| Flask                     | 227   | 0.19 s      | 7        | 0    | 7 (6 example `SECRET_KEY` lines in docs, 1 test `.env`) |

Scans take well under a second for typical projects. Unzipping took about 0.1 to 0.3 s.

### Known limits

- The scan runs inside the upload request (no background jobs yet).
- Findings in documentation and test files are not treated differently, which causes most false positives.
- Only known patterns are detected, so a clean result is not a guarantee.
