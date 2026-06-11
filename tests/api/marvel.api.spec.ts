import { test, expect } from '../fixtures/test-fixtures';

const SKIP_MSG = 'Set MARVEL_TOKEN in config/.env — generate at marvelapp.com/oauth/devtoken';

// Fix #3: test.skip() moved to describe level — guard is in one place, not repeated per test.
// Fix #2: removed duplicate "should return user with required fields" test (toMatch(/@/) already
//         guarantees a non-empty string containing @).
test.describe('Marvel App API - User @smoke @api', () => {
  test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);

  test('should return authenticated user info', async ({ marvelApi }) => {
    const user = await marvelApi.getUser();
    expect(user).toBeDefined();
    expect(user.email).toMatch(/@/);
  });
});

test.describe('Marvel App API - Projects @api', () => {
  test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);

  test('should return list of projects @smoke', async ({ marvelApi }) => {
    const projects = await marvelApi.getProjects();
    expect(Array.isArray(projects)).toBe(true);
  });

  // Fix #1: removed conditional `if (projects.length > 0)` — test now always asserts
  //         that at least one project exists before checking its shape.
  test('should return project with required fields', async ({ marvelApi }) => {
    const projects = await marvelApi.getProjects(1);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].id).toBeDefined();
    expect(typeof projects[0].name).toBe('string');
  });
});

test.describe('Marvel App API - Schema @api', () => {
  test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);

  test('should expose queryable fields via introspection @smoke', async ({ marvelApi }) => {
    const fields = await marvelApi.introspectQueryFields();
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields).toContain('user');
  });
});

// Error Handling uses `request` directly — no token needed, no skip.
test.describe('Marvel App API - Error Handling @api', () => {
  test('should return 401 with an invalid token', async ({ request }) => {
    const response = await request.post('https://api.marvelapp.com/graphql', {
      headers: {
        Authorization: 'Bearer invalid_token_for_testing',
        'Content-Type': 'application/json',
      },
      data: { query: '{ user { email } }' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('invalid');
  });
});
