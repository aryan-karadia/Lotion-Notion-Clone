import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Notes from './pages/Notes';
import Layout from './components/Layout';
import Edit from './pages/Edit';
import NoteView from './pages/NoteView';
import React, { useState, useEffect } from 'react';
import { googleLogout, useGoogleLogin, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function App() { 
  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log('Login Failed:', error)
  });


  useEffect(() => {
    if (user) {
      axios
        .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            Accept: 'application/json'
          }
        })
        .then((res) => {
          setProfile(res.data);
          setIsLoggedIn(true);
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  const handleLogout = async () => {
    await googleLogout();
    setProfile(null);
    setIsLoggedIn(false);
    console.log("Logged out");
  }
  
  
  return (
    <>
      {isLoggedIn ? (   
        <div>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout email={profile.email} logout={handleLogout} />}>
                <Route path="/" element={<Navigate to="/Notes"/>} />
                <Route path="Notes/:id/edit" element={<Edit />} />
                <Route path="/Notes" element={<Notes />} />
                <Route path="Notes/:id/edit/:id" element={<Navigate to="/Notes/:id" />} />
                <Route path="Notes/:id" element={<NoteView />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>

      ) : (
        <div className='login-page'>
          <header>
                <span className="menu-toggle">&#9776;</span>
                <div className="header-text">                
                    <h1>Lotion</h1>
                    <p>Like Notion, but worse.</p>
                </div>
                <span className="filler">
                </span>
          </header>
          <div id="login-body">
          <div className='login'>
            <button onClick={() => login()} className="login-button">Sign in to Lotion with Google</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
