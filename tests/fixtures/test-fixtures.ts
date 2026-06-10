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
      await use(undefined as unknown as MarvelApiHelper);
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
