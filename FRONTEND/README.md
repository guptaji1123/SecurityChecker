# 5 Minute Security Check: Frontend

A web app that scans a zipped project for exposed secrets (API keys, passwords, tokens, private keys) and shows a clear, severity-ranked report with fix steps.

This folder is the **React frontend**. It talks to a separate Express + MongoDB backend (in the `BACKEND` folder) through a small API, and it can also run completely on its own using built-in mock data.

## Features

- **Upload:** drag and drop or browse for a `.zip`, with checks on file type and size before anything is sent.
- **Live progress:** a state machine (idle, uploading, scanning, done, error) with an animated progress bar and polling every 1.5 seconds.
- **Results summary:** scan name, date, files scanned, an overall risk line, and cards for Total, Critical, High, Medium and Low.
- **Severity chart:** a donut chart drawn with plain SVG (no chart library), with hover tooltips and screen reader text.
- **Findings table:** sorted by severity then file, with long paths truncated (full path on hover). It turns into stacked cards on narrow screens.
- **Filters:** severity chips with counts, a search box (file path or type), "Clear filters", and a friendly empty state.
- **Finding detail panel:** why it is risky, how to fix it, and a "treat it as leaked" checklist. It closes with Escape or the close button and returns focus to the clicked row.
- **Edge cases handled:** zero findings, more than 500 findings (truncation notice), unknown scan id (friendly 404 view), and network failure (Retry button).
- **Safe by design:** snippets are always masked, and a front-end safety net redacts anything that looks like a raw secret before it is shown.

## Tech stack

| Tool | Used for |
| --- | --- |
| React 19 | UI components |
| Vite 8 | Dev server and build |
| Tailwind CSS 4 | Styling (design tokens defined in `src/index.css`) |
| React Router 7 | Pages and the `/scan/:id` route |
| ESLint | Code quality |
| Node's built-in test runner | Unit tests (`node --test`) |

No chart library and no UI kit: fewer dependencies means fewer things to break.

## Getting started

**Requirements:** Node.js 20.19 or newer (22 recommended) and npm.

```bash
cd FRONTEND
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Environment variables

Create a `.env` file inside `FRONTEND/` (next to `package.json`):

```
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:5000
VITE_MAX_UPLOAD_MB=50
```

| Variable | What it does |
| --- | --- |
| `VITE_USE_MOCK` | `true` uses the built-in fake API (no backend needed). `false` calls the real backend. |
| `VITE_API_URL` | Base URL of the backend. Do not add `/api` at the end. |
| `VITE_MAX_UPLOAD_MB` | Largest ZIP the upload box accepts. Defaults to 50. Keep it equal to the backend's limit. |

Vite reads `.env` only when it starts, so **restart `npm run dev` after changing it**. Only variables starting with `VITE_` reach the browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with ESLint |
| `node --test` | Run the unit tests |

## Mock mode

With `VITE_USE_MOCK=true`, the app never touches the network. `src/api/mockApi.js` waits about 800 ms per call and returns fake data, so the whole flow can be built and tested without a backend. A scan moves through `queued`, `scanning` and `completed` on successive checks.

You can trigger every state by choosing a **ZIP whose name contains** one of these words (the file can be tiny):

| File name contains | Result |
| --- | --- |
| *(anything else)* | Normal scan with 7 findings across all four severities |
| `clean` | Completed scan with zero findings |
| `many` | 612 findings found, only the first 500 returned (truncation notice) |
| `fail` | The scan fails midway (error card) |
| `reject` | The upload is refused (error card) |

Or open these report URLs directly:

| URL | Result |
| --- | --- |
| `/scan/not-a-real-id` | Friendly "We could not find that scan" page |
| `/scan/offline` | "Can't reach the server" with a Retry button that keeps failing |
| `/scan/flaky` | Fails once, then Retry loads the report |

## Switching to the real backend

1. Start the backend (see the `BACKEND` folder).
2. In `.env`, set `VITE_USE_MOCK=false` and `VITE_API_URL` to the backend address.
3. Restart `npm run dev`.

The backend must allow requests from the frontend origin (CORS). The pages never change: `src/api/client.js` is the only file that picks between mock and real.

## API the frontend expects

Every response uses one envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "message": "Something went wrong" } }
```

| Request | Returns (`data`) |
| --- | --- |
| `POST /api/scans` (form-data, field `file`) | The new scan (status `queued`) |
| `GET /api/scans/:id` | The scan: `id`, `originalName`, `status`, `filesScanned`, `counts`, `createdAt` |
| `GET /api/scans/:id/findings` | An array of at most 500 findings |

- `status` is one of `queued`, `scanning`, `completed`, `failed`.
- `counts` is `{ critical, high, medium, low }` and holds the **true totals**, even when fewer findings are returned.
- Each finding has `id`, `ruleId`, `type`, `severity`, `filePath`, `line`, `maskedSnippet`, `explanation` and `fix`.
- An unknown id returns **404** and a malformed id returns **400**. The frontend shows the "not found" page for both.

## Project structure

```
FRONTEND/
  .env                    settings (see above)
  index.html              the single HTML page
  vite.config.js          React and Tailwind plugins
  src/
    main.jsx              entry point
    App.jsx               routes
    index.css             color tokens (@theme) and base styles
    api/
      client.js           the one door the app uses (mock or real)
      mockApi.js          fake API with test tricks
      mockData.js         fake scans and findings
      errors.js           ApiError with a "kind" (network, not_found, ...)
    components/
      ui/                 Button, Card, Badge (design system)
      layout/             Layout, Navbar, Footer
      home/               Features, HowItWorks
      upload/             DropZone
      scan/               ScanProgress, ScanSummary, SeverityChart
      results/            FindingsExplorer, FindingsFilters,
                          FindingsTable, FindingDetail
    pages/                Home, Scan, ScanResults, NotFound
    utils/                chartMath, findings (pure helpers) and their tests
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Home: hero, features, how it works |
| `/scan` | Upload and live progress |
| `/scan/:id` | Full report for one scan |
| anything else | 404 page |

## Design system

Colors live in one place, the `@theme` block in `src/index.css`, which makes classes like `bg-brand`, `text-critical` and `border-line` available everywhere. Changing a value there changes the whole app. The palette is charcoal, gray, steel blue, rust and cream, plus four severity colors (critical, high, medium, low).

## Testing

```bash
node --test
```

The tests cover the pure helper functions: chart math (including the all-zero case), sorting, searching, filtering, path splitting, secret redaction, and the mock data (no raw secrets, truncation at 500).

## Accessibility

- Every interactive element is keyboard reachable with a visible focus outline.
- The chart has a text description for screen readers, and the filter chips use `aria-pressed`.
- The finding panel uses the native `<dialog>`, which traps focus and closes with Escape. Focus returns to the row that opened it.
- Errors and result counts are announced with `role="alert"` or `aria-live`.

## Security notes

- Files are checked in the browser (type and size) for fast feedback, but the **server must validate again**, because anyone can call the API directly.
- Secret snippets are always masked by the backend. As a second layer, `redact()` in `src/utils/findings.js` hides anything that still looks like a raw AWS key, Stripe key or GitHub token before it is displayed.

## Status

Frontend complete through the results experience (upload, progress, summary, chart, table, filters, detail panel, and all error and empty states). Remaining work is on the backend side: findings endpoint, rule tests, and switching `VITE_USE_MOCK` to `false` once the full flow is verified.
