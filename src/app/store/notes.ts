import { create } from 'zustand'
import { getNotes, saveNote, deleteNote, searchNotes } from '@/lib/tauri'
import type { Note, NoteInput } from '@/lib/types'

interface NotesState {
  notes: Note[]
  searchResults: Note[] | null
  searchQuery: string
  activeNoteId: string | null
  loading: boolean

  loadNotes(topicId: string | null): Promise<void>
  search(query: string): Promise<void>
  clearSearch(): void
  save(input: NoteInput): Promise<Note>
  remove(noteId: string): Promise<void>
  setActiveNote(noteId: string | null): void
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  searchResults: null,
  searchQuery: '',
  activeNoteId: null,
  loading: false,

  async loadNotes(topicId) {
    set({ loading: true })
    try {
      const notes = await getNotes(topicId)
      set({ notes, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  async search(query) {
    set({ searchQuery: query })
    if (!query.trim()) {
      set({ searchResults: null })
      return
    }
    const results = await searchNotes(query)
    set({ searchResults: results })
  },

  clearSearch() {
    set({ searchResults: null, searchQuery: '' })
  },

  async save(input) {
    const note = await saveNote(input)
    set((s) => {
      const idx = s.notes.findIndex((n) => n.id === note.id)
      if (idx >= 0) {
        const updated = [...s.notes]
        updated[idx] = note
        return { notes: updated }
      }
      return { notes: [note, ...s.notes] }
    })
    return note
  },

  async remove(noteId) {
    await deleteNote(noteId)
    set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) }))
  },

  setActiveNote(noteId) {
    set({ activeNoteId: noteId })
  },
}))
