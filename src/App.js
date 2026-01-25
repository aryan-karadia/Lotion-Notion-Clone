import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Notes from "./pages/Notes";
import Layout from "./components/Layout";
import Edit from "./pages/Edit";
import NoteView from "./pages/NoteView";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { setUser, logoutUser } from "./stores/UserSlice.ts";

function App() {
  const [accessToken, setAccessToken] = useState(null);

  // Get user data from Redux store instead of local state
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const isLoggedIn = user.email !== null;

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      // Store the access token separately since it's not in the user slice
      sessionStorage.setItem("access_token", codeResponse.access_token);
    },
    onError: (error) => console.log("Login Failed:", error),
    scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
  });

  // Load access token from session storage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem("access_token");
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  // Fetch user profile when access token is available
  useEffect(() => {
    if (accessToken) {
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
  }, [accessToken, dispatch]);

  const handleLogout = () => {
    // Clear access token
    setAccessToken(null);
    // Clear Redux store (this also clears sessionStorage via the reducer)
    dispatch(logoutUser());
  };

  return (
    <>
      {isLoggedIn ? (
        <div>
          <BrowserRouter>
            <Routes>
              <Route
                element={<Layout email={user.email} logout={handleLogout} />}
              >
                <Route path="/" element={<Navigate to="/Notes" />} />
                <Route
                  path="Notes/:id/edit"
                  element={
                    <Edit email={user.email} token={accessToken} />
                  }
                />
                <Route path="/Notes" element={<Notes />} />
                <Route
                  path="Notes/:id/edit/:id"
                  element={<Navigate to="/Notes/:id" />}
                />
                <Route
                  path="Notes/:id"
                  element={
                    <NoteView email={user.email} token={accessToken} />
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;