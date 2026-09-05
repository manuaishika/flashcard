// SM-2 spaced repetition. Pure functions, no I/O.
// Reference: https://super-memory.com/english/ol/sm2.htm
//
// Lemma grades map onto SM-2 quality scores:
//   0 Again -> q2   1 Hard -> q3   2 Good -> q4   3 Easy -> q5

import type { Grade } from "./types.js";

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface ReviewOutcome extends CardState {
  dueAt: Date;
}

const QUALITY_BY_GRADE: Record<Grade, number> = { 0: 2, 1: 3, 2: 4, 3: 5 };

const DAY_MS = 86_400_000;

/** SM-2 ease update. Always applied, then clamped to MIN_EASE. */
function nextEase(ease: number, quality: number): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return Math.max(MIN_EASE, round2(ease + delta));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Advance a card by one review.
 *
 * @param card  current ease / interval / repetition count
 * @param grade the user's grade for this review
 * @param now   review timestamp (defaults to current time); dueAt is derived from it
 */
export function review(card: CardState, grade: Grade, now: Date = new Date()): ReviewOutcome {
  const quality = QUALITY_BY_GRADE[grade];
  const easeFactor = nextEase(card.easeFactor, quality);

  let repetitions: number;
  let intervalDays: number;

  if (quality < 3) {
    // Lapse: reset the streak, see it again tomorrow.
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = card.repetitions + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(card.intervalDays * easeFactor));
    }
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

/** Preview the resulting interval for every grade — used to label the review buttons. */
export function previewIntervals(card: CardState): Record<Grade, number> {
  return {
    0: review(card, 0).intervalDays,
    1: review(card, 1).intervalDays,
    2: review(card, 2).intervalDays,
    3: review(card, 3).intervalDays,
  };
}

export function freshCard(): CardState {
  return { easeFactor: DEFAULT_EASE, intervalDays: 0, repetitions: 0 };
}
