import { test as base } from '@playwright/test';
import { MarvelApiHelper, createMarvelApiHelper } from '../../utils/marvel-api-helper';
import { GoogleSearchPage } from '../../pages/google-search.page';

type TestFixtures = {
  marvelApi: MarvelApiHelper;
  googleSearchPage: GoogleSearchPage;
};

export const test = base.extend<TestFixtures>({
  marvelApi: async ({}, use) => {
    if (!process.env.MARVEL_TOKEN) {
      // Return a Proxy instead of undefined so that any accidental call to marvelApi
      // without a describe-level test.skip() produces a clear, actionable error.
      const stub = new Proxy({} as object, {
        get: (_target, prop) => {
          throw new Error(
            `marvelApi.${String(prop)}() was called but MARVEL_TOKEN is not set.\n` +
            `Add test.skip(!process.env.MARVEL_TOKEN, '...') at the top of your test.describe block.`
          );
        },
      }) as unknown as MarvelApiHelper;
      await use(stub);
      return;
    }
    const api = createMarvelApiHelper({ silent: true });
    await api.init();
    await use(api);
    await api.dispose();
  },

  googleSearchPage: async ({ page }, use) => {
    await use(new GoogleSearchPage(page));
  },
});

export { expect } from '@playwright/test';
