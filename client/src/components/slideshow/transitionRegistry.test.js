import { describe, it, expect } from 'vitest';
import { TRANSITIONS } from './transitionRegistry.js';

describe('TRANSITIONS registry (requirement 5: 5+ transition effects)', () => {
  it('registers at least 5 distinct effects', () => {
    expect(Object.keys(TRANSITIONS).length).toBeGreaterThanOrEqual(5);
  });

  it('gives every effect a label and a positive duration', () => {
    for (const [key, config] of Object.entries(TRANSITIONS)) {
      expect(config.label, `${key} missing a label`).toBeTruthy();
      expect(config.duration, `${key} duration must be > 0`).toBeGreaterThan(0);
    }
  });

  it('includes fade, since the spec explicitly calls out fade-in/fade-out as an example', () => {
    expect(TRANSITIONS).toHaveProperty('fade');
  });
});
