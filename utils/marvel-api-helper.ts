import { APIRequestContext, request } from '@playwright/test';
import { logger } from './logger';

export interface MarvelAppOptions {
  token?: string;
  silent?: boolean;
}

export interface MarvelUser {
  email: string;
  username?: string;
  id?: string;
}

export interface MarvelProject {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Helper for the marvelapp.com GraphQL API.
 * Base URL: https://api.marvelapp.com
 * Auth: Authorization: Bearer <personal_access_token>
 * Token: generate at https://marvelapp.com/oauth/devtoken
 */
export class MarvelApiHelper {
  private apiContext: APIRequestContext | null = null;
  private readonly token: string;
  readonly baseUrl = 'https://api.marvelapp.com';

  constructor(options: MarvelAppOptions = {}) {
    this.token = options.token ?? process.env.MARVEL_TOKEN ?? '';

    if (!this.token) {
      throw new Error(
        'Marvel App token required. Set MARVEL_TOKEN in config/.env — generate one at https://marvelapp.com/oauth/devtoken'
      );
    }

    if (options.silent) {
      logger.silent = true;
    }
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async init(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: this.headers,
      ignoreHTTPSErrors: true,
    });
  }

  async query<T>(gql: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (!this.apiContext) await this.init();

    logger.debug('Marvel GraphQL query', { query: gql.slice(0, 80) });

    const response = await this.apiContext!.post('/graphql', {
      data: { query: gql, variables },
    });

    const body: GraphQLResponse<T> = await response.json();

    if (body.errors?.length) {
      throw new Error(`GraphQL error: ${body.errors.map((e) => e.message).join(', ')}`);
    }

    if (!response.ok()) {
      throw new Error(`Marvel API ${response.status()}: ${JSON.stringify(body)}`);
    }

    return body.data as T;
  }

  async getUser(): Promise<MarvelUser> {
    const data = await this.query<{ user: MarvelUser }>(`
      {
        user {
          email
          username
        }
      }
    `);
    return data.user;
  }

  async getProjects(limit = 10): Promise<MarvelProject[]> {
    const data = await this.query<{
      projects: { edges: Array<{ node: MarvelProject }> };
    }>(
      `
      query GetProjects($limit: Int) {
        projects(first: $limit) {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
            }
          }
        }
      }
    `,
      { limit }
    );
    return data.projects.edges.map((e) => e.node);
  }

  async introspectQueryFields(): Promise<string[]> {
    const data = await this.query<{
      __schema: { queryType: { fields: Array<{ name: string }> } };
    }>(`{ __schema { queryType { fields { name } } } }`);
    return data.__schema.queryType.fields.map((f) => f.name);
  }

  async dispose(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose().catch(() => {});
      this.apiContext = null;
    }
  }
}

export function createMarvelApiHelper(options?: MarvelAppOptions): MarvelApiHelper {
  return new MarvelApiHelper(options);
}
