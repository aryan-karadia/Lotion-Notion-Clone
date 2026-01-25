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
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fetch notes on component mount
    useEffect(() => {
        const loadNotes = async () => {
            try {
                await dispatch(fetchNotes({ email: props.email, token: props.token })).unwrap();
            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setInitialLoadComplete(true);
            }
        };

        loadNotes();
    }, [dispatch, props.email, props.token]);

    const navigateToNote = (noteId) => {
        setActiveNoteId(noteId);
        navigate(`/Notes/${noteId}`);
        // Close mobile menu when navigating to a note
        setIsMobileMenuOpen(false);
    }

    const newNote = async () => {
        console.log("Creating new note");
        try {
            const newNoteData = await dispatch(createNoteFrontend({ email: props.email })).unwrap();
            setActiveNoteId(newNoteData.id);
            navigate(`/Notes/${newNoteData.id}/edit`);
            // Close mobile menu when creating a new note
            setIsMobileMenuOpen(false);
        } catch (error) {
            console.error("Error creating new note:", error);
        }
    }

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }

    // Close menu when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector(".side-menu");
            const menuToggle = document.querySelector(".menu-toggle");

            if (isMobileMenuOpen && sidebar && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobileMenuOpen]);

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
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                {/* Overlay for mobile menu */}
                {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

                {/* Only render child routes after initial load is complete */}
                {initialLoadComplete ? (
                    <Outlet />
                ) : (
                    <div id="body">
                        <div style={{ color: "var(--secondary-color)" }}>Loading notes...</div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Layout;