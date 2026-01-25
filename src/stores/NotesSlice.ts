import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface Note {
  Content: string;
  Title: string;
  email: string;
  when: Date;
  id: number;
}

export interface NotesState {
  notes: Note[];
  count: number;
  loading: boolean;
  error: string | null;
}

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
    { email, token }: { email: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        "https://oeurpvedfschzmurcc5abpypcq0jdtbn.lambda-url.ca-central-1.on.aws/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            email: email,
            "Access-token": token,
          },
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch notes');
      }

      const notes = await res.json();
      
      // Convert 'when' strings to Date objects if needed
      const parsedNotes = notes.map((note: any) => ({
        ...note,
        when: typeof note.when === 'string' ? new Date(note.when) : note.when,
      }));

      return {
        notes: parsedNotes,
        count: parsedNotes.length,
      };
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
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setNotes, addNote, updateNote, deleteNote, clearNotes } = notesSlice.actions;

export default notesSlice.reducer;
