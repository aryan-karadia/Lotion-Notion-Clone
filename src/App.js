import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Notes from './pages/Notes';
import Layout from './components/Layout';
import Edit from './pages/Edit';
import NoteView from './pages/NoteView';
import { useState } from 'react';
import Login from './pages/Login';

function App() {

  const [user, setUser] = useState("");

  return (
    <>
      <BrowserRouter>
          <Routes>
            {!user ? (<Route path="*" element={<Login />} />)
            : (
              <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/Notes"/>} />
              <Route path="Notes/:id/edit" element={<Edit />} />
              <Route path="/Notes" element={<Notes />} />
              <Route path="Notes/:id/edit/:id" element={<Navigate to="/Notes/:id" />} />
              <Route path="Notes/:id" element={<NoteView />} />
            </Route>
            )
          }

          </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
