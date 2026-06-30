import { useEffect } from 'react'
import { useCapstoneStore } from './capstoneStore'
import type { MilestoneId } from './milestones'
import { PrerequisiteGate } from './components/PrerequisiteGate'
import { CapstoneProgress } from './components/CapstoneProgress'
import { surface, text, accent, grade, font, radius } from '@/theme'

interface NeuralNetCapstoneProps {
  onStudyCalculus?: () => void
  onStudyLinearAlgebra?: () => void
}

export function NeuralNetCapstone({
  onStudyCalculus,
  onStudyLinearAlgebra,
}: NeuralNetCapstoneProps) {
  const store = useCapstoneStore()

  useEffect(() => {
    store.load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (store.isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: text.muted,
          fontSize: 13,
          fontFamily: font.ui,
        }}
      >
        Loading capstone…
      </div>
    )
  }

  if (store.error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          fontFamily: font.ui,
        }}
      >
        <div style={{ color: grade.wrong, fontSize: 13 }}>Error: {store.error}</div>
        <button
          onClick={() => store.load()}
          style={{
            padding: '7px 16px',
            borderRadius: radius.md,
            border: `1px solid rgba(154,124,255,0.3)`,
            background: 'rgba(154,124,255,0.1)',
            color: accent.text,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: font.ui,
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!store.arePrereqsMet()) {
    return (
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: surface.base,
        }}
      >
        <PrerequisiteGate
          prerequisiteMastery={store.prerequisiteMastery}
          onStudyCalculus={onStudyCalculus}
          onStudyLinearAlgebra={onStudyLinearAlgebra}
        />
      </div>
    )
  }

  const handleBegin = async (id: MilestoneId) => {
    await store.load()
    void id
  }

  const handleMarkComplete = async (id: MilestoneId, notes: string) => {
    await store.completeMilestone(id, notes)
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 24px',
        boxSizing: 'border-box',
        background: surface.base,
      }}
    >
      <CapstoneProgress
        milestones={store.milestones}
        progress={store.progress}
        completionPercent={store.completionPercent()}
        getMilestoneStatus={(id) => store.getMilestoneStatus(id)}
        isUnlocked={(id) => store.isUnlocked(id)}
        onBegin={handleBegin}
        onMarkComplete={handleMarkComplete}
      />
    </div>
  )
}
