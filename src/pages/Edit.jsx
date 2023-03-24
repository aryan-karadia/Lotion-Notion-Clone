import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Edit = (props) => {
    const email = props.email;
    const access_token = props.token;
    const { id } = useParams();
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    };
    const formatDate = (when) => {
        const formatted = new Date(when).toLocaleString("en-US", options);
        if (formatted === "Invalid Date") {
            return "";
        }
        return formatted;
    };

    const setDate = (e) => {    
        let date = formatDate(e.target.value);
        setNote({
            ...note,
            when: date
        });
    };

    const navigate = useNavigate();
    const [content, setContent] = useState("");

    const ChangeTitle = (e) => {
        setTitle(e.target.value);
        setNote({
            ...note,
            Title :e.target.value
        });
    };
    
    const [title, setTitle] = useState("");
    const [note, setNote] = useState({id: `${id}`, Title: `${title}`, Content: "", when: formatDate(Date.now())});

    useEffect( 
        () => {
            const curNote = JSON.parse(localStorage.getItem(`${id}`));
            curNote ? setTitle(`${curNote.Title}`) : setTitle("Untitled");
            if (curNote) {
                setNote({...note, 
                    Title: curNote.Title,
                    Content: curNote.Content,
                    when: curNote.when
                });
                setContent(curNote.Content);
                setTitle(curNote.Title);
                console.log("title", title);
                console.log("curnote", curNote);
                console.log(note);
            }
        }, []);

    useEffect( () => {
        console.log("title", title);
        setNote({
            ...note,
            Title: title,
            Content: content
        });
        
    }, [title]);
    
    
     const saveContent = (html) => {
        setContent(html);
        setNote({
            ...note,
            Content: html
        }
        );
    };


    const save = async () => {
        // save-lambda_url = "https://oxvt53qsm3qxtxctk3qo5rmed40efknj.lambda-url.ca-central-1.on.aws/"
        // email and access token in headers
        // body = {id: id, Title: note.Title, Content: note.Content, when: note.when}
        console.log(note);
        const res = await fetch("https://oxvt53qsm3qxtxctk3qo5rmed40efknj.lambda-url.ca-central-1.on.aws/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "email": JSON.stringify(email),
                'Access-token': JSON.stringify(access_token)
            },
            body: JSON.stringify({...note, email: email}),
        });
        console.log("saved");
        const noteTitle = document.querySelector(`#note-${id}`);
        let preview = note.Content;
        if (preview.length > 50) {
            preview = `${preview.slice(0, 45)}...`;
        }
        noteTitle.innerHTML = `<h2>${note.Title}</h2><p style={{color: "var(--secondary-color)"}} >${note.when}</p><p>${preview}</p>`;
        navigate(`/`);
        navigate(`/Notes/${id}`);
    };

    const Del = () => {
        const answer = window.confirm("Are you sure?");
        if (answer) {
        deleteNote(id);
        }
    }

    const deleteNote = (id) => {
        // delete-note-30140288-url = "https://4hzre52ywo56kfhpjxgtfggjpq0zfkln.lambda-url.ca-central-1.on.aws/"
        // email and access token in headers
        // body = {id: id}
        const curNote = document.querySelector(`#note-${id}`);
        curNote.remove();
        navigate("/Notes");
    }

    return (
        <div id="body">
            <span id="note-header">
                <div>
                    <input type="text" defaultValue={title} className="title" onChange={(e) => ChangeTitle(e)} />
                    <input className="date" type="datetime-local" defaultValue={Date.now()} onChange={(e) => setDate(e)}/>
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