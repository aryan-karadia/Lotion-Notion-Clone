import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../stores/hooks";
import { deleteNoteAsync } from "../stores/NotesSlice.ts";
import 'react-quill/dist/quill.bubble.css';

const NoteView = (props) => {
    const email = props.email;
    const access_token = props.token;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    let { id } = useParams();
    const noteId = parseInt(id, 10);

    // Get notes from Redux store
    const notes = useAppSelector((state) => state.notes.notes);
    const loading = useAppSelector((state) => state.notes.loading);
    const currentNote = notes.find((note) => note.id === noteId);
    const [content, setContent] = useState("");

    useEffect(() => {
        if (currentNote) {
            setContent(currentNote.Content);
        }
    }, [currentNote]);

    const editNote = () => {
        navigate(`/Notes/${noteId}/edit`);
    }

    const Del = () => {
        const answer = window.confirm("Are you sure?");
        if (answer) {
            deleteNoteHandler();
        }
    }

    const deleteNoteHandler = async () => {
        try {
            await dispatch(deleteNoteAsync({
                noteId,
                email,
                token: access_token
            })).unwrap();
            navigate("/Notes");
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    }

    // Show loading state while fetching notes (after all hooks)
    if (loading) {
        return (
            <div id="body">
                <div style={{ color: "var(--secondary-color)" }}>Loading note...</div>
            </div>
        );
    }

    // Check if note exists - redirect if not found (after all hooks)
    if (!currentNote) {
        return <Navigate to="/Notes" replace />;
    }

    return (
        <div id="body">
            <div>
                <span id="note-header">
                    <div>
                        <h1 className="view-title">{currentNote.Title}</h1>
                        <p style={{ color: "var(--secondary-color)" }}>{currentNote.when}</p>
                    </div>
                    <span>
                        <span className="save-btn" onClick={editNote}>Edit</span>
                        <span className="del-btn" onClick={Del}>Delete</span>
                    </span>
                </span>
                <ReactQuill className="editor" value={content} readOnly={true} theme={"bubble"} />
            </div>
        </div>
    );
}

export default NoteView;