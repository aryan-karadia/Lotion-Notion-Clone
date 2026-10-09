
import { googleLogout } from "@react-oauth/google";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { getGuestSession, GUEST_SESSION_KEY } from "../guest/session/index.ts";

export interface UserState {
  email: string | null;
  name: string | null;
  mode: "google" | "guest" | null;
}

// check session storage for existing user data otherwise set to null
const storedUser = sessionStorage.getItem("user");
const guestSession = getGuestSession();
const initialState: UserState = {
  email: guestSession?.email ?? (storedUser ? JSON.parse(storedUser).email : null),
  name: guestSession ? "Guest" : (storedUser ? JSON.parse(storedUser).name : null),
  mode: guestSession ? "guest" : (storedUser ? "google" : null),
};


export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<{ email: string; name: string }>) {
            state.email = action.payload.email;
            state.name = action.payload.name;
            state.mode = "google";
            sessionStorage.removeItem(GUEST_SESSION_KEY);
            // update session storage
            sessionStorage.setItem("user", JSON.stringify({ email: state.email, name: state.name }));
        },
        logoutUser(state) {
                googleLogout();
                state.email = null;
                state.name = null;
                state.mode = null;
                // clear session storage
                sessionStorage.removeItem("user");
                // Clear access token            
                sessionStorage.removeItem("access_token");
                console.log("Logged out");
        },
        setGuestUser(state, action: PayloadAction<{ email: string }>) {
            state.email = action.payload.email;
            state.name = "Guest";
            state.mode = "guest";
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("access_token");
        },
        logoutGuest(state) {
            state.email = null;
            state.name = null;
            state.mode = null;
            sessionStorage.removeItem(GUEST_SESSION_KEY);
        },
    },
});

export const { setUser, setGuestUser, logoutUser, logoutGuest } = userSlice.actions;

export default userSlice.reducer;