export class ResponseExtractor {
  static extractValue<T = unknown>(response: Record<string, unknown>, path: string): T | null {
    if (!response || !path) return null;
    let current: unknown = response;
    for (const part of path.split('.')) {
      if (current == null) return null;
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown[]>)[key]?.[parseInt(index)];
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }
    return (current as T) ?? null;
  }

  static extractValues(
    response: Record<string, unknown>,
    paths: Record<string, string>
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(paths).map(([name, path]) => [name, this.extractValue(response, path)])
    );
  }

  static extractId(response: Record<string, unknown>): number | string | null {
    for (const field of ['id', 'Id', 'ID', 'resourceId', 'entityId']) {
      if (field in response && response[field] != null) return response[field] as number | string;
    }
    return null;
  }

  static extractFirstItem<T = unknown>(
    response: Record<string, unknown>,
    arrayPath = 'items'
  ): T | null {
    const arr = this.extractValue(response, arrayPath);
    return Array.isArray(arr) && arr.length > 0 ? (arr[0] as T) : null;
  }

  static extractItems<T = unknown>(
    response: Record<string, unknown>,
    arrayPath = 'items'
  ): T[] {
    const arr = this.extractValue(response, arrayPath);
    return Array.isArray(arr) ? (arr as T[]) : [];
  }

  static extractIds(
    response: Record<string, unknown>,
    arrayPath = 'items'
  ): (number | string)[] {
    return this.extractItems(response, arrayPath)
      .map((item) => {
        const rec = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
        return this.extractId(rec);
      })
      .filter((id): id is number | string => id != null);
  }

  static validateRequired(response: Record<string, unknown>, requiredFields: string[]): string[] {
    return requiredFields.filter((field) => this.extractValue(response, field) == null);
  }
}

export class DataChainBuilder {
  private data: Map<string, unknown> = new Map();

  set(key: string, value: unknown): void { this.data.set(key, value); }
  get<T = unknown>(key: string): T | undefined { return this.data.get(key) as T; }
  has(key: string): boolean { return this.data.has(key); }
  delete(key: string): void { this.data.delete(key); }
  clear(): void { this.data.clear(); }
  getAll(): Record<string, unknown> { return Object.fromEntries(this.data); }

  extractAndStore(response: Record<string, unknown>, key: string, path?: string): unknown {
    const value = path ? ResponseExtractor.extractValue(response, path) : response;
    this.set(key, value);
    return value;
  }

  extractIdAndStore(response: Record<string, unknown>, key: string): number | string | null {
    const id = ResponseExtractor.extractId(response);
    this.set(key, id);
    return id;
  }

  buildRequestData(mapping: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [storedKey, requestField] of Object.entries(mapping)) {
      if (this.has(storedKey)) result[requestField] = this.get(storedKey);
    }
    return result;
  }
}

export function createDataChain(): DataChainBuilder {
  return new DataChainBuilder();
}
