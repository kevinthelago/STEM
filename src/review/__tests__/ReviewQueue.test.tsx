import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewQueue } from "../ReviewQueue";
import { useReviewStore } from "../reviewStore";
import type { ReviewItem } from "../api";

vi.mock("../reviewStore");

const mockLoadQueue = vi.fn().mockResolvedValue(undefined);
const mockStartSession = vi.fn();

function makeItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: "1",
    topic_id: "t1",
    topic_name: "Derivatives",
    subject: "Calculus",
    due_at: new Date(Date.now() - 3_600_000).toISOString(),
    interval: 1,
    ease: 2.5,
    reps: 0,
    last_result: null,
    kind: "explain",
    ...overrides,
  };
}

function mockStore(
  overrides: Partial<ReturnType<typeof useReviewStore>> = {},
) {
  (useReviewStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    dueItems: [],
    overdueCount: 0,
    isLoading: false,
    error: null,
    loadQueue: mockLoadQueue,
    startSession: mockStartSession,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReviewQueue", () => {
  it("renders empty state when no items are due", () => {
    mockStore({ dueItems: [], overdueCount: 0 });
    render(<ReviewQueue />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it("renders item count and start button when items exist", () => {
    mockStore({
      dueItems: [makeItem({ id: "1" }), makeItem({ id: "2", topic_name: "Integrals" })],
      overdueCount: 0,
    });
    render(<ReviewQueue />);
    expect(screen.getByText(/2 items due/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start review session/i })).toBeInTheDocument();
  });

  it("renders overdue count when non-zero", () => {
    mockStore({
      dueItems: [makeItem()],
      overdueCount: 3,
    });
    render(<ReviewQueue />);
    expect(screen.getByText(/3 overdue/i)).toBeInTheDocument();
  });

  it("does not render overdue count when zero", () => {
    mockStore({ dueItems: [makeItem()], overdueCount: 0 });
    render(<ReviewQueue />);
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockStore({ dueItems: [], overdueCount: 0, isLoading: true });
    render(<ReviewQueue />);
    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    mockStore({ dueItems: [], overdueCount: 0, error: "Network error" });
    render(<ReviewQueue />);
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("lists topic names in the queue", () => {
    mockStore({
      dueItems: [
        makeItem({ id: "1", topic_name: "Derivatives" }),
        makeItem({ id: "2", topic_name: "Integrals" }),
      ],
      overdueCount: 0,
    });
    render(<ReviewQueue />);
    expect(screen.getByText("Derivatives")).toBeInTheDocument();
    expect(screen.getByText("Integrals")).toBeInTheDocument();
  });

  it("calls loadQueue on mount", () => {
    mockStore();
    render(<ReviewQueue />);
    expect(mockLoadQueue).toHaveBeenCalledTimes(1);
  });
});
