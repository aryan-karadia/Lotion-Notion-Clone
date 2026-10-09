import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createNotesApi } from "../api/notesApi.ts";
import { getGuestNotesStorage } from "../guest/session/index.ts";

export interface Note {
  Content: string;
  Title: string;
  email: string;
  when: string;
  id: number;
}

export interface NotesState {
  notes: Note[];
  count: number;
  loading: boolean;
  error: string | null;
  nextId?: number;
}

type SessionArgs = {
  email: string;
  token?: string;
  mode?: "google" | "guest";
};

const getSession = ({ email, token, mode }: SessionArgs) => {
  const sessionMode = mode ?? (token ? "google" : "guest");
  return {
    mode: sessionMode,
    email,
    ...(sessionMode === "google" && token ? { token } : {}),
  } as const;
};

const initialState: NotesState = {
  notes: [],
  count: 0,
  loading: false,
  error: null,
};

// Async thunk for fetching notes
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (
    { email, token, mode }: SessionArgs,
    { rejectWithValue, getState }
  ) => {
    try {
      const session = getSession({
        email,
        token,
        mode: mode ?? (getState() as { user?: { mode?: "google" | "guest" } }).user?.mode,
      });
      const result = await createNotesApi(session, getGuestNotesStorage()).getNotes(session);
      const parsedNotes = result.notes.map((note) => ({
        ...note,
        when: typeof note.when === 'string' ? note.when : new Date(note.when).toLocaleString(),
      }));

      console.log("Fetched notes:", parsedNotes);

      // find next Id
      let maxId = 0;
        parsedNotes.forEach((note: Note) => {
            if (note.id > maxId) {
                maxId = note.id;
            }
        });
        const nextId = maxId + 1;
        console.log("Next note ID:", nextId);

      return {
        notes: parsedNotes,
        count: result.count || parsedNotes.length,
        nextId: nextId,
      };
    } catch (error: any) {
        console.error("Error fetching notes:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a note
export const deleteNoteAsync = createAsyncThunk(
  'notes/deleteNote',
  async (
    { noteId, email, token, mode }: { noteId: number } & SessionArgs,
    { rejectWithValue, getState }
  ) => {
    try {
      const session = getSession({
        email,
        token,
        mode: mode ?? (getState() as { user?: { mode?: "google" | "guest" } }).user?.mode,
      });
      return await createNotesApi(session, getGuestNotesStorage()).deleteNote(session, noteId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for creating a new note on frontend only
export const createNoteFrontend = createAsyncThunk(
  'notes/createNoteFrontend',
  async (
    { email }: { email: string },
    { getState }
  ) => {
    const state = getState() as { notes: NotesState };
    const nextId = state.notes.nextId || 1;

    const newNote: Note = {
      Content: "",
      Title: "New Note",
      email: email,
      when: new Date().toLocaleString(),
      id: nextId,
    };

    return newNote;
  }
);

// Async thunk for saving/updating a note
export const saveNoteAsync = createAsyncThunk(
  'notes/saveNote',
  async (
    { note, email, token, mode }: { note: Note } & SessionArgs,
    { rejectWithValue, getState }
  ) => {
    try {
      const session = getSession({
        email,
        token,
        mode: mode ?? (getState() as { user?: { mode?: "google" | "guest" } }).user?.mode,
      });
      return await createNotesApi(session, getGuestNotesStorage()).saveNote(session, note);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setNotes(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload;
      state.count = action.payload.length;
    },
    addNote(state, action: PayloadAction<Note>) {
      state.notes.push(action.payload);
      state.count += 1;
    },
    updateNote(state, action: PayloadAction<Note>) {
      const index = state.notes.findIndex((note) => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    deleteNote(state, action: PayloadAction<number>) {
      state.notes = state.notes.filter((note) => note.id !== action.payload);
      state.count -= 1;
    },
    clearNotes(state) {
      state.notes = [];
      state.count = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.notes;
        state.count = action.payload.count;
        state.nextId = action.payload.nextId;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveNoteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveNoteAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.id);
        if (index !== -1) {
          // Update existing note
          state.notes[index] = action.payload;
        } else {
          // Add new note
          state.notes.push(action.payload);
          state.count += 1;
        }
      })
      .addCase(saveNoteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteNoteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload);
        state.count -= 1;
      })
      .addCase(deleteNoteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createNoteFrontend.fulfilled, (state, action) => {
        // Add new note to frontend store
        state.notes.push(action.payload);
        state.count += 1;
        // Increment nextId for future notes
        state.nextId = (state.nextId || 1) + 1;
      });
  },
});

export const { setNotes, addNote, updateNote, deleteNote, clearNotes } = notesSlice.actions;

export default notesSlice.reducer;
