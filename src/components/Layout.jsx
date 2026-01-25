import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { createNoteFrontend, fetchNotes } from "../stores/NotesSlice.ts";
import UserProfile from "./UserProfile";
import Sidebar from "./Sidebar";

const Layout = (props) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const notes = useAppSelector((state) => state.notes.notes);
    const loading = useAppSelector((state) => state.notes.loading);
    const [activeNoteId, setActiveNoteId] = useState(null);

    // Fetch notes on component mount
    useEffect(() => {
        dispatch(fetchNotes({ email: props.email, token: props.token }));
    }, [dispatch, props.email, props.token]);

    const navigateToNote = (noteId) => {
        setActiveNoteId(noteId);
        navigate(`/Notes/${noteId}`);
    }

    const newNote = async () => {
        console.log("Creating new note");
        try {
            const newNoteData = await dispatch(createNoteFrontend({ email: props.email })).unwrap();
            setActiveNoteId(newNoteData.id);
            navigate(`/Notes/${newNoteData.id}/edit`);
        } catch (error) {
            console.error("Error creating new note:", error);
        }
    }

    const toggleMenu = () => {
        const menu = document.querySelector(".side-menu");
        menu.style.display === "none" ? menu.style.display = "flex" : menu.style.display = "none";
    }

    return (
        <>
            <header>
                <span className="menu-toggle" onClick={toggleMenu}>&#9776;</span>
                <div className="header-text">
                    <h1>Lotion</h1>
                    <p>Like Notion, but worse.</p>
                </div>
                <UserProfile email={props.email} handleLogout={props.logout} />
            </header>
            <div id="content">
                <Sidebar
                    notes={notes}
                    loading={loading}
                    activeNoteId={activeNoteId}
                    onNavigateNote={navigateToNote}
                    onNewNote={newNote}
                />
                <Outlet />
            </div>
        </>
    )
}

export default Layout;