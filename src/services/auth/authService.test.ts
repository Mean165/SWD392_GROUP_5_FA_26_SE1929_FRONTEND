import { describe, expect, it } from 'vitest';
import { normalizeRole } from './authService';

describe('normalizeRole', () => {
  it.each([
    ['ROLE_LE', 'LECTURER'],
    ['LE', 'LECTURER'],
    ['LECTURER', 'LECTURER'],
    ['ROLE_AD', 'ADMIN'],
    ['AD', 'ADMIN'],
    ['ADMIN', 'ADMIN'],
    ['ROLE_ST', 'STUDENT'],
  ] as const)('normalizes %s to %s', (rawRole, expected) => {
    expect(normalizeRole(rawRole)).toBe(expected);
  });
});
