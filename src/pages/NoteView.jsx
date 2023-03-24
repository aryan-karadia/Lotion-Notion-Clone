import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { useParams, useNavigate } from "react-router-dom";
import 'react-quill/dist/quill.bubble.css';

const NoteView = (props) => {
    const email = props.email;
    const access_token = props.token;
    const navigate = useNavigate();
    const { id } = useParams();
    const [note, setNote] = useState({id: `${id}`, Title: "", Content: "", when: ""});
    const [content, setContent] = useState("");
    
    useEffect(() => {
        const getNotes = async () => {
            const email = props.email;
            const access_token = props.token;
            const res = await fetch("https://oeurpvedfschzmurcc5abpypcq0jdtbn.lambda-url.ca-central-1.on.aws/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "email": email,
                    'Access-token': access_token
                }
            });
            const notesArray = await res.json();
            const notes = notesArray.notes;
            const curNote = notes[id-1];
            console.log(curNote);
            if (curNote) {
            setNote({...note, 
                Title: curNote.Title,
                Content: curNote.Content,
                when: curNote.when
            })
            setContent(curNote.Content);
            console.log(note);
            console.log(content);
            const curNoteTitle = document.querySelector(`#note-${id}`);
            curNoteTitle.classList.add("active");
            
        } else {
            navigate("/Notes");
        }
        }
        getNotes();
    }, []);

    const navigateToNote = (idnum) => {
        const prevNote = document.querySelector(".active");
        if (prevNote) {
            prevNote.classList.remove("active");
        }
        const curNote = document.querySelector(`#note-${idnum}`);
        curNote.classList.add("active");
        navigate(`/Notes/${idnum}`);
    }

    useEffect( () => {
        navigateToNote(id);
        const curNote = JSON.parse(localStorage.getItem(`${id}`));
        if (curNote) {
            setNote({...note, 
                Title: curNote.Title,
                Content: curNote.Content,
                when: curNote.when
            })
            setContent(curNote.Content);
        } else {
            navigate("/Notes");
        }
    }, [id]);

    const editNote = () => {
        navigate(`/Notes/${id}/edit`);
    }

    const Del = () => {
        const answer = window.confirm("Are you sure?");
        if (answer) {
            deleteNote(id);
        }
    }

    const deleteNote = (id) => {
        localStorage.removeItem(`${id}`);
        const curNote = document.querySelector(`#note-${id}`);
        curNote.remove();
        navigate("/Notes");
    }

    return (
        <div id="body">
            {note && (
                <div>
                    <span id="note-header">
                        <div>
                            <h1 className="view-title">{note.Title}</h1>
                            <p style={{color: "var(--secondary-color)"}} >{note.when}</p>
                        </div>
                        <span>
                            <span className="save-btn" onClick={editNote}>Edit</span>
                            <span className="del-btn" onClick={Del}>Delete</span>
                        </span>
                    </span>
                    <ReactQuill className="editor" value={content} readOnly={true} theme={"bubble"} />
                </div>
            )}
        </div>
    );
}

export default NoteView;
