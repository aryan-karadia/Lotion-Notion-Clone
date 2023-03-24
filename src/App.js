import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Notes from './pages/Notes';
import Layout from './components/Layout';
import Edit from './pages/Edit';
import NoteView from './pages/NoteView';
import Login from './pages/Login';
import React, { useState, useEffect } from 'react';
import { googleLogout, useGoogleLogin, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function App() { 
  const [email, setEmail] = useState("");
  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState({});

  useEffect(
    () => {
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
                    setEmail(res.data.email);
                    console.log("email: " + email);
                    console.log("user: " + user);
                })
                .catch((err) => console.log(err));
        }
    },
    [ user ]
);


  const responseMessage = (response) => {
    console.log(response);
    setUser(response);
    
  };
  const errorMessage = (error) => {
      console.log(error);
  };

  return (
    <>
    {!user ? (        

              <div>
                <h2>React Google Login</h2>
                <br />
                <br />
                <GoogleLogin onSuccess={responseMessage} onError={errorMessage}>Sign in to Lotion with Google</GoogleLogin>
              </div>
           )
            : (
      <BrowserRouter>
          <Routes>
              <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/Notes"/>} />
              <Route path="Notes/:id/edit" element={<Edit />} />
              <Route path="/Notes" element={<Notes />} />
              <Route path="Notes/:id/edit/:id" element={<Navigate to="/Notes/:id" />} />
              <Route path="Notes/:id" element={<NoteView />} />
            </Route>
          </Routes>
      </BrowserRouter>
            )
          }

    </>
  )
}

export default App;
