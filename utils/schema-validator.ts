import { expect } from "@playwright/test";

/**
 * Validates that every field in `schema` exists on `response` with the expected typeof.
 * Uses expect.soft() so all field mismatches are reported in a single test run.
 *
 * @example
 * validateSchema<Booking>(response.booking, {
 *   firstname: 'string',
 *   totalprice: 'number',
 *   depositpaid: 'boolean',
 * });
 */
export function validateSchema<T extends object>(
  response: unknown,
  schema: Partial<Record<keyof T, string>>,
): void {
  const obj = response as Record<string, unknown>;
  for (const [field, expectedType] of Object.entries(schema)) {
    expect.soft(typeof obj[field], `field "${field}" type`).toBe(expectedType);
  }
}
