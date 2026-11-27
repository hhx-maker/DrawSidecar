import { afterEach } from 'vitest';
import 'fake-indexeddb/auto';

afterEach(() => {
  document.body.innerHTML = '';
});
