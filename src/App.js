import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { setUser, setGuestUser, logoutUser, logoutGuest } from "./stores/UserSlice.ts";
import { startGuestSession, endGuestSession, getGuestNotesStorage, setGuestNotesStorage } from "./guest/session/index.ts";
import { ensureGuestSeeded, guestNotesStorage, resetGuestDemoData } from "./components/guest/guestStorage.ts";
import { ProtectedRoute, ProtectedNoteRoute } from "./routes/ProtectedRoutes";
import Layout from "./components/Layout";
import Notes from "./pages/Notes";
import Edit from "./pages/Edit";
import NoteView from "./pages/NoteView";
import GuestLoginButton from "./components/guest/GuestLoginButton";

function App() {
  const [accessToken, setAccessToken] = useState(null);

  // Get user data and notes from Redux store
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const notes = useAppSelector((state) => state.notes.notes);
  const isLoggedIn = user.email !== null;
  const isGuest = user.mode === "guest";

  useEffect(() => {
    setGuestNotesStorage(guestNotesStorage);
    if (isGuest) ensureGuestSeeded();
  }, [isGuest]);

  useEffect(() => {
    const beginGuest = () => {
      sessionStorage.removeItem("access_token");
      setAccessToken(null);
      startGuestSession({ storage: getGuestNotesStorage(), fresh: true });
      ensureGuestSeeded();
      dispatch(setGuestUser({ email: "guest@lotion.local" }));
    };
    window.addEventListener("lotion:guest-login", beginGuest);
    return () => window.removeEventListener("lotion:guest-login", beginGuest);
  }, [dispatch]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      // Store the access token separately since it's not in the user slice
      sessionStorage.setItem("access_token", codeResponse.access_token);
    },
    onError: (error) => console.log("Login Failed:", error),
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
  });

  // Load access token from session storage on mount
  useEffect(() => {
    const storedToken = isGuest ? null : sessionStorage.getItem("access_token");
    if (storedToken) {
      setAccessToken(storedToken);
    } else if (isGuest) {
      setAccessToken(null);
    }
  }, [isGuest]);

  // Fetch user profile when access token is available
  useEffect(() => {
    if (accessToken && !isGuest) {
      axios
        .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        })
        .then((res) => {
          // Dispatch to Redux store instead of setState
          dispatch(setUser({
            email: res.data.email,
            name: res.data.name
          }));
        })
        .catch((err) => console.log(err));
    }
  }, [accessToken, dispatch, isGuest]);

  const handleLogout = () => {
    // Clear access token
    setAccessToken(null);
    // Clear Redux store (this also clears sessionStorage via the reducer)
    if (isGuest) {
      endGuestSession(getGuestNotesStorage(), { wipe: true });
      dispatch(logoutGuest());
    } else {
      dispatch(logoutUser());
    }
  };

  const handleResetGuest = () => {
    resetGuestDemoData();
    window.location.reload();
  };

  return (
    <>
      {isLoggedIn ? (
        <BrowserRouter future={{ v7_startTransition: true }}>
          <Routes>
            <Route
              element={              <Layout email={user.email} logout={handleLogout} token={accessToken} mode={user.mode}
                onResetGuest={handleResetGuest} />}
            >
              <Route path="/" element={<Navigate to="/Notes" />} />
              <Route
                path="/Notes"
                element={
                  <ProtectedRoute isLoggedIn={isLoggedIn}>
                    <Notes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Notes/:id"
                element={
                  <ProtectedNoteRoute isLoggedIn={isLoggedIn} notes={notes}>
                    <NoteView email={user.email} token={accessToken} />
                  </ProtectedNoteRoute>
                }
              />
              <Route
                path="/Notes/:id/edit"
                element={
                  <ProtectedNoteRoute isLoggedIn={isLoggedIn} notes={notes}>
                    <Edit email={user.email} token={accessToken} />
                  </ProtectedNoteRoute>
                }
              />
              <Route path="*" element={<Navigate to="/Notes" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      ) : (
        <div className="login-page">
          <header>
            <span className="menu-toggle">&#9776;</span>
            <div className="header-text">
              <h1>Lotion</h1>
              <p>Like Notion, but worse.</p>
            </div>
            <span className="filler"></span>
          </header>
          <div id="login-body">
            <div className="login">
              <button onClick={login} className="login-button">
                Sign in to Lotion with{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  fill="currentColor"
                  className="bi bi-google"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 
                  15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 
                  8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 
                  3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"
                  />
                </svg>
              </button>
              <GuestLoginButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;