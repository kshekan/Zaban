export interface CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ReviewResult extends CardState {
  nextReview: Date;
}

/**
 * SM-2 spaced repetition algorithm.
 * Quality ratings: 0 = complete blackout, 1 = wrong, 2 = hard, 3 = good, 4 = easy, 5 = perfect
 */
export function sm2(state: CardState, quality: number): ReviewResult {
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  let { easeFactor, interval, repetitions } = state;

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Clamp minimum ease factor
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  if (quality < 3) {
    // Incorrect — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReview,
  };
}

/** UX button mappings to SM-2 quality scores */
export const qualityLabels = [
  { label: "Again", quality: 0, color: "destructive" as const },
  { label: "Hard", quality: 2, color: "secondary" as const },
  { label: "Good", quality: 3, color: "default" as const },
  { label: "Easy", quality: 5, color: "outline" as const },
];
