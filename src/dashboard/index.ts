export { MasteryDashboard } from "./MasteryDashboard";
export { useMasteryStore } from "./masteryStore";
export {
  computeMasteryScore,
  recommendNextTopic,
  groupBySubject,
  weakAreas,
  DEFAULT_WEIGHTS,
} from "./masteryModel";
export type { SignalWeights } from "./masteryModel";
export type { MasteryRecord, PracticeAttempt, Topic } from "./api";
