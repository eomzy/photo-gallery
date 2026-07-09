import { describe, it, expect } from 'vitest';
import { getSpan, MAX_SPECIAL } from './getSpan.js';

describe('getSpan (collage mosaic layout)', () => {
  it('gives a single photo the full hero tile', () => {
    expect(getSpan(1, 0)).toEqual({ col: 4, row: 3 });
  });

  it('splits two photos evenly', () => {
    expect(getSpan(2, 0)).toEqual({ col: 2, row: 3 });
    expect(getSpan(2, 1)).toEqual({ col: 2, row: 3 });
  });

  it('gives the first of three photos a taller hero tile', () => {
    expect(getSpan(3, 0)).toEqual({ col: 2, row: 3 });
    expect(getSpan(3, 1)).toEqual({ col: 2, row: 2 });
    expect(getSpan(3, 2)).toEqual({ col: 2, row: 2 });
  });

  it('gives four photos a uniform 2x2 quadrant layout', () => {
    for (let i = 0; i < 4; i++) {
      expect(getSpan(4, i)).toEqual({ col: 2, row: 2 });
    }
  });

  it('gives 5-8 photos a hero-first layout with small uniform tiles after', () => {
    for (const count of [5, 6, 7, 8]) {
      expect(getSpan(count, 0)).toEqual({ col: 2, row: 2 });
      expect(getSpan(count, 1)).toEqual({ col: 1, row: 1 });
      expect(getSpan(count, count - 1)).toEqual({ col: 1, row: 1 });
    }
  });

  it('exposes the special-layout cutoff used by CollageModal to fall back to a uniform grid', () => {
    expect(MAX_SPECIAL).toBe(8);
  });
});
