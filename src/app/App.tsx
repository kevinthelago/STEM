import { useEffect } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { useCurriculumStore, useSessionStore, useSettingsStore, useNavStore } from './store'
import { onTutorChunk, onParsedProblem, onParsedGrade, onParsedMastery, onParsedViz } from '@/lib/tauri'
import { LearnMode } from '@/modes/learn/LearnMode'
import { PracticeMode } from '@/modes/practice/PracticeMode'
import { TerminalMode } from '@/modes/terminal/TerminalMode'
import { ResearchMode } from '@/modes/research/ResearchMode'
import { Notes } from '@/notes/Notes'
import { Settings } from '@/settings/Settings'
import { surface } from '@/theme'
import type { ActiveView } from '@/lib/types'

export default function App() {
  const { load: loadCurriculum, updateTopicMastery } = useCurriculumStore()
  const { appendTutorChunk, setProblem, setGrade, attachVizToLastMessage } = useSessionStore()
  const { load: loadSettings } = useSettingsStore()
  const view = useNavStore((s) => s.view)

  // Bootstrap
  useEffect(() => {
    loadCurriculum()
    loadSettings()
  }, [loadCurriculum, loadSettings])

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
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <MainContent view={view} />
        </main>
      </div>
      <StatusBar />
    </div>
  )
}

function MainContent({ view }: { view: ActiveView }) {
  if (view.type === 'settings') return <Settings />
  if (view.type === 'notes') return <Notes topicId={view.topicId} />

  if (view.type === 'dashboard') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#626878',
          fontSize: '13px',
        }}
      >
        Dashboard — coming soon (frontend-viz stream)
      </div>
    )
  }

  if (view.type === 'review') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#626878',
          fontSize: '13px',
        }}
      >
        Review — coming soon (frontend-viz stream)
      </div>
    )
  }

  // mode view
  const { mode, topicId } = view
  if (mode === 'learn') return <LearnMode topicId={topicId} />
  if (mode === 'practice') return <PracticeMode topicId={topicId} />
  if (mode === 'visualize') return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#626878',
        fontSize: '13px',
      }}
    >
      Visualize — frontend-viz stream
    </div>
  )
  if (mode === 'research') return <ResearchMode topicId={topicId} />

  // terminal — accessible via the terminal button / command palette
  return <TerminalMode topicId={topicId} />
}
