import { APIRequestContext, request } from '@playwright/test';
import { logger } from './logger';

export interface AuthResponse {
  token: string;
  expiresAt?: string;
}

export class RestApiHelper {
  private apiContext: APIRequestContext | null = null;
  protected token: string = '';
  protected readonly baseUrl: string;
  private readonly silentLogs: boolean;

  constructor(baseUrl: string, options?: { silent?: boolean }) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.silentLogs = options?.silent ?? false;
    if (this.silentLogs) logger.silent = true;
  }

  async init(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
  }

  /**
   * Generic token-based authentication.
   * Override in a subclass to implement your app's auth scheme.
   */
  async authenticate(endpoint: string, credentials: Record<string, unknown>): Promise<string> {
    if (!this.apiContext) await this.init();

    const response = await this.apiContext!.post(endpoint, { data: credentials });

    if (!response.ok()) {
      throw new Error(`Authentication failed: ${response.status()} ${response.statusText()}`);
    }

    const body = (await response.json()) as AuthResponse;
    this.token = body.token;
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  protected async restRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number>
  ): Promise<T> {
    if (!this.apiContext) await this.init();

    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
      ).toString();
      url = `${endpoint}?${qs}`;
    }

    logger.debug(`${method} ${this.baseUrl}${url}`);

    const options: Record<string, unknown> = { headers: this.headers() };
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) options.data = data;

    const response = await this.apiContext![
      method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'
    ](url, options);

    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `${method} ${endpoint} → ${response.status()} ${response.statusText()}. ${body}`
      );
    }

    const text = await response.text();
    if (!text.trim()) return {} as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  protected async graphqlRequest<T>(
    operationName: string,
    variables: Record<string, unknown>,
    query: string,
    endpoint = '/graphql'
  ): Promise<T> {
    if (!this.apiContext) await this.init();

    const response = await this.apiContext!.post(endpoint, {
      headers: this.headers(),
      data: { operationName, variables, query },
    });

    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`GraphQL ${operationName} → ${response.status()}. ${body}`);
    }

    const body = await response.json();
    if (body.errors?.length) {
      throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
    }

    return body.data as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    return this.restRequest<T>('GET', endpoint, undefined, params);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.restRequest<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.restRequest<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.restRequest<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.restRequest<T>('DELETE', endpoint);
  }

  async dispose(): Promise<void> {
    if (this.silentLogs) logger.silent = false;
    if (this.apiContext) {
      await this.apiContext.dispose().catch(() => {});
      this.apiContext = null;
    }
  }
}

export function createRestApiHelper(
  baseUrl: string,
  options?: { silent?: boolean }
): RestApiHelper {
  return new RestApiHelper(baseUrl, options);
}

export { RestApiHelper as ApiHelper, createRestApiHelper as createApiHelper };
export type { AuthResponse as TestDataIds };
