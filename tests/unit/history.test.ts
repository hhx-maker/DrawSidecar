import { describe, expect, it } from 'vitest';
import { History } from '../../src/services/history';

describe('History', () => {
  it('undoes, redoes, and clears the future after a new push', () => {
    const history = new History('a');
    history.push('b'); history.push('c');
    expect(history.undo()).toBe('b');
    expect(history.redo()).toBe('c');
    history.undo(); history.push('d');
    expect(history.canRedo).toBe(false);
    expect(history.present).toBe('d');
  });
});
