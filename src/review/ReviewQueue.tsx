import React, { useEffect } from "react";
import { useReviewStore } from "./reviewStore";

function formatDueStatus(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  if (diffMs <= 0) return "due now";
  const days = Math.floor(diffMs / 86_400_000);
  if (days > 0) return `${days}d past due`;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours > 0) return `${hours}h past due`;
  return "just past due";
}

interface ReviewQueueProps {
  onStartSession?: () => void;
}

export function ReviewQueue({ onStartSession }: ReviewQueueProps) {
  const { dueItems, overdueCount, isLoading, error, loadQueue, startSession } =
    useReviewStore();

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleStart = () => {
    startSession();
    onStartSession?.();
  };

  if (isLoading) {
    return <div className="review-queue review-queue--loading">Loading reviews…</div>;
  }

  if (error) {
    return (
      <div className="review-queue review-queue--error">
        <p>Failed to load review queue: {error}</p>
        <button onClick={loadQueue}>Retry</button>
      </div>
    );
  }

  if (dueItems.length === 0) {
    return (
      <div className="review-queue review-queue--empty">
        <div className="review-queue__empty-icon">✓</div>
        <h3>All caught up!</h3>
        <p>No reviews due right now. Keep studying and check back later.</p>
      </div>
    );
  }

  return (
    <div className="review-queue">
      <div className="review-queue__header">
        <div className="review-queue__counts">
          <span className="review-queue__due-count">
            {dueItems.length} item{dueItems.length !== 1 ? "s" : ""} due
          </span>
          {overdueCount > 0 && (
            <span className="review-queue__overdue-count">
              {overdueCount} overdue
            </span>
          )}
        </div>
        <button
          className="review-queue__start-btn"
          onClick={handleStart}
          disabled={dueItems.length === 0}
        >
          Start review session
        </button>
      </div>

      <ul className="review-queue__list">
        {dueItems.map((item) => (
          <li key={item.id} className="review-queue__item">
            <div className="review-queue__item-info">
              <span className="review-queue__item-name">{item.topic_name}</span>
              <span className="review-queue__item-subject">{item.subject}</span>
            </div>
            <div className="review-queue__item-meta">
              <span className="review-queue__item-kind">
                {item.kind === "problem" ? "Problem" : "Explain"}
              </span>
              <span className="review-queue__item-due-status">
                {formatDueStatus(item.due_at)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
