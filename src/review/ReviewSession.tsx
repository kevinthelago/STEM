import React, { useState } from "react";
import { useReviewStore } from "./reviewStore";
import type { ReviewOutcome } from "./sm2";

type SimplifiedOutcome = "forgot" | "hard" | "good" | "easy";

const SIMPLIFIED_QUALITY: Record<SimplifiedOutcome, { quality: number; outcome: ReviewOutcome }> = {
  forgot: { quality: 1, outcome: "incorrect" },
  hard:   { quality: 3, outcome: "hesitant" },
  good:   { quality: 4, outcome: "correct" },
  easy:   { quality: 5, outcome: "perfect" },
};

interface ReviewSessionProps {
  totalItems: number;
  onComplete?: () => void;
}

export function ReviewSession({ totalItems, onComplete }: ReviewSessionProps) {
  const { currentItem, sessionResults, submitResult, endSession } = useReviewStore();
  const [userResponse, setUserResponse] = useState("");
  const [phase, setPhase] = useState<"prompt" | "grade">("prompt");
  const [submitting, setSubmitting] = useState(false);

  const reviewedCount = sessionResults.length;
  const lapseCount = sessionResults.filter((r) => r.quality < 3).length;

  // Session complete
  if (!currentItem && reviewedCount > 0) {
    const avgQuality =
      sessionResults.reduce((s, r) => s + r.quality, 0) / sessionResults.length;
    return (
      <div className="review-session review-session--complete">
        <h2>Session complete!</h2>
        <div className="review-session__summary">
          <div className="review-session__stat">
            <span className="review-session__stat-value">{reviewedCount}</span>
            <span className="review-session__stat-label">Reviewed</span>
          </div>
          <div className="review-session__stat">
            <span className="review-session__stat-value">{avgQuality.toFixed(1)}</span>
            <span className="review-session__stat-label">Avg quality</span>
          </div>
          <div className="review-session__stat">
            <span className="review-session__stat-value">{lapseCount}</span>
            <span className="review-session__stat-label">Lapses</span>
          </div>
        </div>
        <button
          className="review-session__done-btn"
          onClick={() => {
            endSession();
            onComplete?.();
          }}
        >
          Done
        </button>
      </div>
    );
  }

  if (!currentItem) return null;

  const handleReveal = () => setPhase("grade");

  const handleGrade = async (simplified: SimplifiedOutcome) => {
    const { quality, outcome } = SIMPLIFIED_QUALITY[simplified];
    setSubmitting(true);
    await submitResult(quality, outcome);
    setUserResponse("");
    setPhase("prompt");
    setSubmitting(false);
  };

  const prompt =
    currentItem.kind === "explain"
      ? `Can you explain: ${currentItem.topic_name}?`
      : `Recall a problem involving: ${currentItem.topic_name}`;

  return (
    <div className="review-session">
      <div className="review-session__progress">
        {reviewedCount + 1} of {totalItems}
      </div>

      <div className="review-session__card">
        <div className="review-session__subject">{currentItem.subject}</div>
        <h2 className="review-session__topic">{currentItem.topic_name}</h2>
        <p className="review-session__prompt">{prompt}</p>

        {phase === "prompt" && (
          <>
            <textarea
              className="review-session__response"
              placeholder="Write your answer or explanation here…"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              rows={4}
            />
            <button className="review-session__reveal-btn" onClick={handleReveal}>
              Show grading
            </button>
          </>
        )}

        {phase === "grade" && (
          <div className="review-session__grade-area">
            {userResponse && (
              <div className="review-session__user-response">{userResponse}</div>
            )}
            <p className="review-session__grade-prompt">How did it go?</p>
            <div className="review-session__grade-buttons">
              {(["forgot", "hard", "good", "easy"] as SimplifiedOutcome[]).map((o) => (
                <button
                  key={o}
                  className={`review-session__grade-btn review-session__grade-btn--${o}`}
                  onClick={() => handleGrade(o)}
                  disabled={submitting}
                >
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="review-session__streak">
        {reviewedCount > 0 && (
          <span>
            Last: {sessionResults[sessionResults.length - 1].quality >= 3 ? "✓" : "✗"}
          </span>
        )}
      </div>
    </div>
  );
}
