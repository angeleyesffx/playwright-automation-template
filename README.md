# playwright-automation-template

A production-ready Playwright automation template with TypeScript, featuring API testing (Marvel App GraphQL), UI testing (Wikipedia), and scalable authentication via `storageState`.

---

## Tech Stack

- [Playwright Test](https://playwright.dev/) — cross-browser E2E and API testing
- TypeScript — strict mode
- Faker.js — test data generation
- dotenv — local environment configuration

---

## Project Structure

```
├── config/
│   └── .env.example        # Environment variable template
├── pages/
│   ├── base/
│   │   ├── base-page.ts        # Generic base page (navigation, fill, assertions)
│   │   └── base-table-page.ts  # ARIA-based table interactions
│   └── google-search.page.ts   # Wikipedia search page object
├── scripts/
│   ├── custom-reporter.ts      # Custom Playwright reporter
│   ├── report-template.ts      # HTML report generator
│   └── send-email-report.ts    # Email notification helper
├── tests/
│   ├── auth/
│   │   └── auth.setup.ts       # storageState setup (runs once before UI tests)
│   ├── fixtures/
│   │   └── test-fixtures.ts    # Shared fixtures (marvelApi, googleSearchPage)
│   ├── UI/
│   │   └── google-search.spec.ts
│   └── api/
│       └── marvel.api.spec.ts
└── utils/
    ├── faker-data-generator.ts  # Generic test data (identity, address, dates)
    ├── logger.ts                # Singleton logger with API request/response formatting
    ├── marvel-api-helper.ts     # Marvel App GraphQL API helper
    ├── message-helpers.ts       # ARIA alert/toast assertion utilities
    ├── response-extractor.ts    # Path-based JSON response extraction
    └── rest-api-helpers.ts      # Generic REST + GraphQL base class
```

---

## Setup

```bash
npm install
npx playwright install
```

Copy the environment template and fill in your values:

```bash
cp config/.env.example config/.env
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MARVEL_TOKEN` | Optional | Personal access token — generate at [marvelapp.com/oauth/devtoken](https://marvelapp.com/oauth/devtoken) |
| `APP_BASE_URL` | Optional | Base URL for the app under test |
| `APP_EMAIL` | Optional | Email for authenticated UI tests |
| `APP_PASSWORD` | Optional | Password for authenticated UI tests |

> API tests are **skipped** when `MARVEL_TOKEN` is not set.  
> UI tests run unauthenticated when `APP_EMAIL`/`APP_PASSWORD` are not set.

---

## Running Tests

```bash
# All UI tests (chromium, headed)
npm test

# UI tests only
npm run test:ui

# API tests only
npm run test:api

# Smoke suite (UI + API)
npm run test:smoke

# All tests headless (Playwright default)
npx playwright test
```

---

## Key Concepts

### storageState (auth scaling)

`tests/auth/auth.setup.ts` runs once before any UI test and saves the browser session to `playwright/.auth/user.json`. All `chromium` project tests reuse this state, so authentication happens only once regardless of how many tests run.

To implement a login flow, fill in the `TODO` in [tests/auth/auth.setup.ts](tests/auth/auth.setup.ts).

### Fixtures

`tests/fixtures/test-fixtures.ts` exposes two fixtures:

- **`googleSearchPage`** — pre-constructed `GoogleSearchPage` instance bound to the current `page`
- **`marvelApi`** — authenticated `MarvelApiHelper`; fixture is `undefined` (and tests auto-skip) when `MARVEL_TOKEN` is not set

### Page Object Model

`BasePage` provides generic helpers (`navigate`, `fillField`, `waitForVisible`, `validateFieldValue`). All page objects extend it and declare their own `Locator` fields using `page.locator()` and ARIA roles — no hardcoded CSS frameworks.

---

## CI Integration

The template reads standard CI variables:

- `CI=true` — disables emoji formatting in logs
- `BUILD_ID` / `GITHUB_RUN_ID` — build identifier
- `BUILD_NUMBER` / `GITHUB_RUN_NUMBER` — sequential build number
- `EMAIL_RECIPIENTS` — comma-separated list for report notifications

GitHub Actions example:

```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    MARVEL_TOKEN: ${{ secrets.MARVEL_TOKEN }}
    APP_BASE_URL: ${{ vars.APP_BASE_URL }}
    APP_EMAIL: ${{ secrets.APP_EMAIL }}
    APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
```
