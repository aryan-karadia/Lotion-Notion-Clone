import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Notes from "./pages/Notes";
import Layout from "./components/Layout";
import Edit from "./pages/Edit";
import NoteView from "./pages/NoteView";
import React, { useState, useEffect } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

function App() {
  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
  });

  useEffect(() => {
    // Try to retrieve user information from local storage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A//www.googleapis.com/auth/drive.metadata.readonly&include_granted_scopes=true&response_type=token&redirect_uri=https://lotion-notion-clone.netlify.app&client_id=228095394015-uat8jdgidrbpfgqem7rs0p92bq320sa3.apps.googleusercontent.com`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
          setIsLoggedIn(true);
          // Store user information in local storage
          localStorage.setItem("user", JSON.stringify(user));
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  const handleLogout = async () => {
    await googleLogout();
    setIsLoggedIn(false);
    // Remove user information from local storage on logout
    localStorage.removeItem("user");
    console.log("Logged out");
  };

  return (
    <>
      {isLoggedIn ? (
        <div>
          <BrowserRouter>
            <Routes>
              <Route
                element={<Layout email={profile.email} logout={handleLogout} />}
              >
                <Route path="/" element={<Navigate to="/Notes" />} />
                <Route
                  path="Notes/:id/edit"
                  element={
                    <Edit email={profile.email} token={user.access_token} />
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
                    <NoteView email={profile.email} token={user.access_token} />
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
              <button onClick={() => login()} className="login-button">
                Sign in to Lotion with{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  fill="currentColor"
                  class="bi bi-google"
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
