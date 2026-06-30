import type { Milestone, MilestoneId } from '../milestones'
import type { CapstoneProgress as CapstoneProgressRecord } from '../api'
import { MilestoneCard } from './MilestoneCard'
import { surface, border, text, accent, mastery as masteryTokens, font, radius } from '@/theme'

interface CapstoneProgressProps {
  milestones: Milestone[]
  progress: CapstoneProgressRecord[]
  completionPercent: number
  getMilestoneStatus: (id: MilestoneId) => CapstoneProgressRecord['status']
  isUnlocked: (id: MilestoneId) => boolean
  onBegin?: (id: MilestoneId) => void
  onMarkComplete?: (id: MilestoneId, notes: string) => void
}

export function CapstoneProgress({
  milestones,
  progress,
  completionPercent,
  getMilestoneStatus,
  isUnlocked,
  onBegin,
  onMarkComplete,
}: CapstoneProgressProps) {
  const allComplete = completionPercent === 100
  const completedCount = progress.filter((p) => p.status === 'complete').length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 680,
        margin: '0 auto',
        padding: '24px 0',
        fontFamily: font.ui,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: text.primary }}>
            Neural Network from Scratch
          </h2>
          <span style={{ fontSize: 12, color: text.placeholder, fontFamily: font.mono, flexShrink: 0 }}>
            {completedCount} / {milestones.length}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              flex: 1,
              height: 5,
              background: surface.track,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              role="progressbar"
              aria-valuenow={completionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                width: `${completionPercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${accent.primary}, ${masteryTokens.mastered})`,
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span style={{ fontFamily: font.mono, fontSize: 11, color: text.muted, flexShrink: 0 }}>
            {completionPercent}%
          </span>
        </div>
      </div>

      {/* Completion banner */}
      {allComplete && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            padding: '18px 22px',
            borderRadius: radius.xl,
            background: 'rgba(67,184,136,0.08)',
            border: '1px solid rgba(67,184,136,0.28)',
          }}
        >
          <div style={{ fontSize: 28, flexShrink: 0 }}>🎉</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: masteryTokens.mastered, marginBottom: 4 }}>
              Capstone complete — you built a neural network from scratch!
            </div>
            <div style={{ fontSize: 13, color: text.muted, lineHeight: 1.6 }}>
              You implemented scalar autograd, neurons, layers, backpropagation, a training loop,
              and model evaluation — the same foundations underlying PyTorch and JAX. You earned the
              Neural-Net mastery signal.
            </div>
          </div>
        </div>
      )}

      {/* Milestone list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {milestones.map((milestone, idx) => {
          const status = getMilestoneStatus(milestone.id)
          const unlocked = isUnlocked(milestone.id)
          const effectiveStatus: CapstoneProgressRecord['status'] =
            status === 'locked' && unlocked ? 'unlocked' : status
          const rec = progress.find((p) => p.milestone_id === milestone.id)
          const isComplete = effectiveStatus === 'complete'

          return (
            <div key={milestone.id} style={{ display: 'flex', gap: 0 }}>
              {/* Step indicator */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 40,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    border: '2px solid',
                    flexShrink: 0,
                    zIndex: 1,
                    fontFamily: font.mono,
                    ...(isComplete
                      ? {
                          borderColor: masteryTokens.mastered,
                          color: masteryTokens.mastered,
                          background: 'rgba(67,184,136,0.1)',
                        }
                      : effectiveStatus === 'in_progress'
                      ? {
                          borderColor: masteryTokens.learning,
                          color: masteryTokens.learning,
                          background: 'rgba(210,147,74,0.1)',
                        }
                      : effectiveStatus === 'unlocked'
                      ? {
                          borderColor: masteryTokens.proficient,
                          color: masteryTokens.proficient,
                          background: 'rgba(79,147,224,0.1)',
                        }
                      : {
                          borderColor: border.card,
                          color: text.disabled,
                          background: surface.overlay,
                        }),
                  }}
                >
                  {isComplete ? '✓' : idx + 1}
                </div>
                {idx < milestones.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: isComplete ? masteryTokens.mastered : border.inner,
                      minHeight: 24,
                      opacity: isComplete ? 0.6 : 0.4,
                    }}
                  />
                )}
              </div>

              {/* Card */}
              <div style={{ flex: 1, paddingBottom: 14, paddingLeft: 2 }}>
                <MilestoneCard
                  milestone={milestone}
                  status={effectiveStatus}
                  completedAt={rec?.completed_at}
                  completionNotes={rec?.notes}
                  onBegin={
                    onBegin && effectiveStatus === 'unlocked'
                      ? () => onBegin(milestone.id)
                      : undefined
                  }
                  onMarkComplete={
                    onMarkComplete && effectiveStatus === 'in_progress'
                      ? (notes) => onMarkComplete(milestone.id, notes)
                      : undefined
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
