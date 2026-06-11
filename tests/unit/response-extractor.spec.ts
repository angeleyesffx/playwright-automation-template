import { test, expect } from '@playwright/test';
import { ResponseExtractor, DataChainBuilder } from '../../utils/response-extractor';

test.describe('ResponseExtractor @unit', () => {
  test.describe('extractValue', () => {
    test('should extract a top-level value', () => {
      expect(ResponseExtractor.extractValue({ id: 42 }, 'id')).toBe(42);
    });

    test('should extract a nested value by dot-path', () => {
      const data = { user: { email: 'a@b.com' } };
      expect(ResponseExtractor.extractValue(data, 'user.email')).toBe('a@b.com');
    });

    test('should extract an array element by bracket notation', () => {
      const data = { items: ['x', 'y', 'z'] };
      expect(ResponseExtractor.extractValue(data, 'items[1]')).toBe('y');
    });

    test('should return null for a missing path', () => {
      expect(ResponseExtractor.extractValue({ user: {} }, 'user.email')).toBeNull();
    });

    test('should return null for an empty path', () => {
      expect(ResponseExtractor.extractValue({}, '')).toBeNull();
    });
  });

  test.describe('extractValues', () => {
    test('should extract multiple fields from a path map', () => {
      const data = { user: { email: 'a@b.com', name: 'Alice' } };
      const result = ResponseExtractor.extractValues(data, {
        email: 'user.email',
        name: 'user.name',
      });
      expect(result).toEqual({ email: 'a@b.com', name: 'Alice' });
    });
  });

  test.describe('extractId', () => {
    test('should extract the id field', () => {
      expect(ResponseExtractor.extractId({ id: 42 })).toBe(42);
    });

    test('should prefer id over resourceId', () => {
      expect(ResponseExtractor.extractId({ id: 1, resourceId: 99 })).toBe(1);
    });

    test('should fall back to resourceId when id is absent', () => {
      expect(ResponseExtractor.extractId({ resourceId: 99 })).toBe(99);
    });

    test('should return null when no id field is present', () => {
      expect(ResponseExtractor.extractId({ name: 'test' })).toBeNull();
    });
  });

  test.describe('extractItems', () => {
    test('should extract an array from the default "items" path', () => {
      expect(ResponseExtractor.extractItems({ items: [1, 2, 3] })).toEqual([1, 2, 3]);
    });

    test('should return an empty array for a non-array value', () => {
      expect(ResponseExtractor.extractItems({ items: 'not-an-array' })).toEqual([]);
    });

    test('should return an empty array when the path is missing', () => {
      expect(ResponseExtractor.extractItems({})).toEqual([]);
    });
  });

  test.describe('validateRequired', () => {
    test('should return an empty array when all fields are present', () => {
      const data = { id: 1, name: 'Alice', email: 'a@b.com' };
      expect(ResponseExtractor.validateRequired(data, ['id', 'name', 'email'])).toEqual([]);
    });

    test('should return the names of missing fields', () => {
      const missing = ResponseExtractor.validateRequired({ id: 1 }, ['id', 'name', 'email']);
      expect(missing).toContain('name');
      expect(missing).toContain('email');
      expect(missing).not.toContain('id');
    });
  });
});

test.describe('DataChainBuilder @unit', () => {
  test('should store and retrieve values', () => {
    const chain = new DataChainBuilder();
    chain.set('userId', 42);
    expect(chain.get('userId')).toBe(42);
    expect(chain.has('userId')).toBe(true);
  });

  test('should delete a specific key', () => {
    const chain = new DataChainBuilder();
    chain.set('a', 1);
    chain.delete('a');
    expect(chain.has('a')).toBe(false);
  });

  test('should clear all stored values', () => {
    const chain = new DataChainBuilder();
    chain.set('a', 1);
    chain.set('b', 2);
    chain.clear();
    expect(chain.has('a')).toBe(false);
    expect(chain.has('b')).toBe(false);
  });

  test('should build request data from a key mapping', () => {
    const chain = new DataChainBuilder();
    chain.set('userId', 42);
    chain.set('userName', 'Alice');
    const data = chain.buildRequestData({ userId: 'id', userName: 'name' });
    expect(data).toEqual({ id: 42, name: 'Alice' });
  });

  test('should extract and store a value by path', () => {
    const chain = new DataChainBuilder();
    chain.extractAndStore({ user: { id: 99 } } as Record<string, unknown>, 'uid', 'user.id');
    expect(chain.get('uid')).toBe(99);
  });

  test('should extract and store the full response when no path is given', () => {
    const chain = new DataChainBuilder();
    const response = { id: 1 } as Record<string, unknown>;
    chain.extractAndStore(response, 'full');
    expect(chain.get('full')).toEqual({ id: 1 });
  });

  test('should extract and store an entity id', () => {
    const chain = new DataChainBuilder();
    const id = chain.extractIdAndStore({ id: 55, name: 'record' } as Record<string, unknown>, 'recordId');
    expect(id).toBe(55);
    expect(chain.get('recordId')).toBe(55);
  });

  test('getAll should return all stored entries', () => {
    const chain = new DataChainBuilder();
    chain.set('x', 1);
    chain.set('y', 2);
    expect(chain.getAll()).toEqual({ x: 1, y: 2 });
  });
});
