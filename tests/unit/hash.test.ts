import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../../src/services/hash';

describe('sha256Hex', () => {
  it('returns the standard lowercase SHA-256 digest', async () => {
    await expect(sha256Hex(new Blob(['hello']))).resolves.toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
});
