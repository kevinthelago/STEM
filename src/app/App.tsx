import { useEffect, useCallback } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'
import { useCurriculumStore, useSessionStore, useSettingsStore, useNavStore } from './store'
import { onTutorChunk, onParsedProblem, onParsedGrade, onParsedMastery, onParsedViz } from '@/lib/tauri'
import { LearnMode } from '@/modes/learn/LearnMode'
import { PracticeMode } from '@/modes/practice/PracticeMode'
import { TerminalMode } from '@/modes/terminal/TerminalMode'
import { ResearchMode } from '@/modes/research/ResearchMode'
import { MasteryDashboard } from '@/dashboard'
import { ReviewQueue, ReviewSession, useReviewStore } from '@/review'
import { VisualizeMode } from '@/viz'
import { Notes } from '@/notes/Notes'
import { Settings } from '@/settings/Settings'
import { surface } from '@/theme'
import type { ActiveView } from '@/lib/types'

export default function App() {
  const { load: loadCurriculum, updateTopicMastery } = useCurriculumStore()
  const { appendTutorChunk, setProblem, setGrade, attachVizToLastMessage } = useSessionStore()
  const { load: loadSettings } = useSettingsStore()
  const { view, setMode, commandPaletteOpen, openCommandPalette, closeCommandPalette } = useNavStore()

  const handleBackToLearn = useCallback(() => setMode('learn'), [setMode])

  // Bootstrap
  useEffect(() => {
    loadCurriculum()
    loadSettings()
  }, [loadCurriculum, loadSettings])

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [openCommandPalette])

  // Subscribe to backend events
  useEffect(() => {
    const unsubscribers: Array<() => void> = []

    onTutorChunk((p) => appendTutorChunk(p.sessionId, p.chunk, p.done)).then((u) =>
      unsubscribers.push(u),
    )
    onParsedProblem((problem) => {
      setProblem(problem.sessionId, problem)
    }).then((u) => unsubscribers.push(u))
    onParsedGrade((grade) => {
      setGrade(grade.sessionId, grade)
    }).then((u) => unsubscribers.push(u))
    onParsedMastery((update) => {
      updateTopicMastery(update.topicId, update.score)
    }).then((u) => unsubscribers.push(u))
    onParsedViz((viz) => {
      attachVizToLastMessage(viz.sessionId, viz)
    }).then((u) => unsubscribers.push(u))

    return () => unsubscribers.forEach((u) => u())
  }, [appendTutorChunk, setProblem, setGrade, updateTopicMastery, attachVizToLastMessage])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: surface.base,
        overflow: 'hidden',
      }}
    >
      <TopBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!(view.type === 'mode' && view.mode === 'visualize') && <Sidebar />}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <MainContent view={view} onBackToLearn={handleBackToLearn} />
        </main>
      </div>
      <StatusBar />
      <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
    </div>
  )
}

function MainContent({ view, onBackToLearn }: { view: ActiveView; onBackToLearn(): void }) {
  if (view.type === 'settings') return <Settings />
  if (view.type === 'notes') return <Notes topicId={view.topicId} />

  if (view.type === 'dashboard') return <MasteryDashboard />
  if (view.type === 'review') return <ReviewQueueView />

  // mode view
  const { mode, topicId } = view
  if (mode === 'learn') return <LearnMode topicId={topicId} />
  if (mode === 'practice') return <PracticeMode topicId={topicId} />
  if (mode === 'visualize') return <VisualizeMode onBackToLearn={onBackToLearn} />
  if (mode === 'research') return <ResearchMode topicId={topicId} />

  // terminal — accessible via the terminal button / command palette
  return <TerminalMode topicId={topicId} />
}

function ReviewQueueView() {
  const { sessionActive, dueItems } = useReviewStore()

  if (sessionActive) {
    return <ReviewSession totalItems={dueItems.length} />
  }

  return <ReviewQueue />
}
