export class History<T> {
  private readonly past: T[] = [];
  private readonly future: T[] = [];
  private current: T;

  constructor(initial: T, private readonly limit = 20) {
    this.current = initial;
  }

  get present(): T { return this.current; }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }

  push(next: T): T {
    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    this.current = next;
    this.future.length = 0;
    return this.current;
  }

  undo(): T {
    if (!this.canUndo) return this.current;
    this.future.push(this.current);
    this.current = this.past.pop() as T;
    return this.current;
  }

  redo(): T {
    if (!this.canRedo) return this.current;
    this.past.push(this.current);
    this.current = this.future.pop() as T;
    return this.current;
  }
}
