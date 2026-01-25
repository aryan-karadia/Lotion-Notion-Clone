import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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

      const data = await res.json();
      
      // Extract notes array from response
      const notesArray = Array.isArray(data.notes) ? data.notes : [];
      
      // Convert note IDs to numbers and parse dates
      const parsedNotes = notesArray.map((note: any) => ({
        ...note,
        id: typeof note.id === 'string' ? parseInt(note.id, 10) : note.id,
        when: typeof note.when === 'string' ? note.when : new Date(note.when).toLocaleString(),
      }));

      console.log("Fetched notes:", parsedNotes);

      return {
        notes: parsedNotes,
        count: data.count || parsedNotes.length,
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
    { noteId, email, token }: { noteId: number; email: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        "https://4hzre52ywo56kfhpjxgtfggjpq0zfkln.lambda-url.ca-central-1.on.aws/",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            email: email,
            "Access-token": token,
          },
          body: JSON.stringify({
            id: noteId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to delete note');
      }

      const response = await res.json();
      console.log("Note deleted:", response);

      return noteId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for saving/updating a note
export const saveNoteAsync = createAsyncThunk(
  'notes/saveNote',
  async (
    { note, email, token }: { note: Note; email: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        "https://oxvt53qsm3qxtxctk3qo5rmed40efknj.lambda-url.ca-central-1.on.aws/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            email: email,
            "Access-token": token,
          },
          body: JSON.stringify({ ...note, email: email }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save note');
      }

      const response = await res.json();
      console.log("Note saved:", response);

      return note;
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
      });
  },
});

export const { setNotes, addNote, updateNote, deleteNote, clearNotes } = notesSlice.actions;

export default notesSlice.reducer;
