import { test, expect } from '../fixtures/test-fixtures';

const SKIP_MSG = 'Set MARVEL_TOKEN in config/.env — generate at marvelapp.com/oauth/devtoken';

test.describe('Marvel App API - User @smoke @api', () => {
  test('should return authenticated user info', async ({ marvelApi }) => {
    test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);
    const user = await marvelApi.getUser();
    expect(user).toBeDefined();
    expect(user.email).toMatch(/@/);
  });

  test('should return user with required fields', async ({ marvelApi }) => {
    test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);
    const user = await marvelApi.getUser();
    expect(typeof user.email).toBe('string');
    expect(user.email.length).toBeGreaterThan(0);
  });
});

test.describe('Marvel App API - Projects @api', () => {
  test('should return list of projects @smoke', async ({ marvelApi }) => {
    test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);
    const projects = await marvelApi.getProjects();
    expect(Array.isArray(projects)).toBe(true);
  });

  test('should return project with required fields', async ({ marvelApi }) => {
    test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);
    const projects = await marvelApi.getProjects(1);
    if (projects.length > 0) {
      expect(projects[0].id).toBeDefined();
      expect(typeof projects[0].name).toBe('string');
    }
  });
});

test.describe('Marvel App API - Schema @api', () => {
  test('should expose queryable fields via introspection @smoke', async ({ marvelApi }) => {
    test.skip(!process.env.MARVEL_TOKEN, SKIP_MSG);
    const fields = await marvelApi.introspectQueryFields();
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields).toContain('user');
  });
});

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
