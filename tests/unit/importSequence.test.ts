import { describe, expect, it } from 'vitest';
import { ImportSequence } from '../../src/services/importSequence';

describe('ImportSequence', () => {
  it('keeps an older asynchronous import from becoming current', () => {
    const sequence = new ImportSequence();
    const first = sequence.next();
    const second = sequence.next();
    expect(sequence.isCurrent(first)).toBe(false);
    expect(sequence.isCurrent(second)).toBe(true);
  });
});
