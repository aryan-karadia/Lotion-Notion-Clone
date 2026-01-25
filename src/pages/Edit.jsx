import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from 'react-quill';
import { useAppSelector, useAppDispatch } from "../stores/hooks";
import { saveNoteAsync, deleteNoteAsync } from "../stores/NotesSlice.ts";
import 'react-quill/dist/quill.snow.css';

const Edit = (props) => {
    const email = props.email;
    const access_token = props.token;
    const { id } = useParams();
    const noteId = parseInt(id, 10);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Get notes from Redux store
    const notes = useAppSelector((state) => state.notes.notes);
    const currentNote = notes.find((note) => note.id === noteId);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [when, setWhen] = useState(new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    }));
    // Initialize note data on mount
    useEffect(() => {
        if (currentNote) {
            setTitle(currentNote.Title);
            setContent(currentNote.Content);
            setWhen(currentNote.when);
        } else {
            setTitle("Untitled");
            setContent("");
        }
    }, [currentNote]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleDateChange = (e) => {
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        };
        const formatted = new Date(e.target.value).toLocaleString("en-US", options);
        if (formatted !== "Invalid Date") {
            setWhen(formatted);
        }
    };

    const saveContent = (html) => {
        setContent(html);
    };

    const save = async () => {
        const noteToSave = {
            id: noteId,
            Title: title,
            Content: content,
            email: email,
            when: when,
        };

        try {
            await dispatch(saveNoteAsync({
                note: noteToSave,
                email,
                token: access_token
            })).unwrap();
            navigate(`/Notes/${noteId}`);
        } catch (error) {
            console.error("Error saving note:", error);
        }
    };

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

    return (
        <div id="body">
            <span id="note-header">
                <div>
                    <input type="text" value={title} className="title" onChange={handleTitleChange} />
                    <input className="date" type="datetime-local" onChange={handleDateChange} />
                </div>
                <span>
                    <span className="save-btn" onClick={save}>Save</span>
                    <span className="del-btn" onClick={Del}>Delete</span>
                </span>
            </span>
            <ReactQuill theme={"snow"} className="editor" placeholder="Your Note Here" value={content} onChange={saveContent} />
        </div>
    );
}


export default Edit;