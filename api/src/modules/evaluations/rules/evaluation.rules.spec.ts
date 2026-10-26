import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertNotAlreadyEvaluated,
  assertScoreInRange,
} from './evaluation.rules.js';

describe('evaluation rules', () => {
  it('E2: score is an integer 1 to 5', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      expect(() => assertScoreInRange(s)).not.toThrow();
    }
    expect(() => assertScoreInRange(0)).toThrow(ConflictException);
    expect(() => assertScoreInRange(6)).toThrow(ConflictException);
    expect(() => assertScoreInRange(3.5)).toThrow('integer');
  });

  it('E3: a deliverable may not be evaluated twice', () => {
    expect(() => assertNotAlreadyEvaluated(false)).not.toThrow();
    expect(() => assertNotAlreadyEvaluated(true)).toThrow('immutable');
  });
});
