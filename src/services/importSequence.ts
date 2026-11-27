export class ImportSequence {
  private current = 0;

  next(): number {
    this.current += 1;
    return this.current;
  }

  isCurrent(sequence: number): boolean {
    return sequence === this.current;
  }
}
