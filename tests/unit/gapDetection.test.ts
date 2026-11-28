import { describe, expect, it } from 'vitest';
import { detectGapCandidates } from '../../src/engine/gapDetection';

describe('detectGapCandidates', () => {
  it('finds a short gap between two line endpoints', () => {
    const skeleton = new Uint8Array(25);
    skeleton[2 * 5 + 1] = 1; skeleton[2 * 5 + 2] = 1; skeleton[2 * 5 + 4] = 1;
    const candidates = detectGapCandidates(skeleton, skeleton, 5, 5, 3);
    expect(candidates.some((candidate) => candidate.start.x === 2 || candidate.end.x === 2)).toBe(true);
  });
});
