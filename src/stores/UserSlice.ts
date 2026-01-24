
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface UserState {
  email: string | null;
  name: string | null;
}

// check session storage for existing user data otherwise set to null
const initialState: UserState = {
  email: sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")!).email : null,
  name: sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")!).name : null,
};


export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<{ email: string; name: string }>) {
            state.email = action.payload.email;
            state.name = action.payload.name;
            // update session storage
            sessionStorage.setItem("user", JSON.stringify({ email: state.email, name: state.name }));
        },
        clearUser(state) {
            state.email = null;
            state.name = null;
            // clear session storage
            sessionStorage.removeItem("user");
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;