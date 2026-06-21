export interface SM2State {
  interval: number;
  ease: number;
  reps: number;
}

export interface SM2Result {
  state: SM2State;
  dueAt: Date;
}

export const DEFAULT_SM2_STATE: SM2State = { interval: 1, ease: 2.5, reps: 0 };

export function sm2Advance(state: SM2State, quality: number, now?: Date): SM2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const base = now ?? new Date();

  if (q < 3) {
    const newState: SM2State = { interval: 1, ease: state.ease, reps: 0 };
    const dueAt = new Date(base.getTime() + newState.interval * 86_400_000);
    return { state: newState, dueAt };
  }

  let interval: number;
  if (state.reps === 0) {
    interval = 1;
  } else if (state.reps === 1) {
    interval = 6;
  } else {
    interval = Math.round(state.interval * state.ease);
  }

  const newEase = Math.max(1.3, state.ease + 0.1 - (5 - q) * 0.08 - (5 - q) ** 2 * 0.02);
  const newState: SM2State = { interval, ease: newEase, reps: state.reps + 1 };
  const dueAt = new Date(base.getTime() + interval * 86_400_000);
  return { state: newState, dueAt };
}

export type ReviewOutcome = "perfect" | "correct" | "hesitant" | "incorrect" | "blackout";

export function sm2QualityFromOutcome(outcome: ReviewOutcome): number {
  switch (outcome) {
    case "perfect":   return 5;
    case "correct":   return 4;
    case "hesitant":  return 3;
    case "incorrect": return 1;
    case "blackout":  return 0;
  }
}
