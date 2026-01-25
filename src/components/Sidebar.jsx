const Sidebar = ({ notes, loading, activeNoteId, onNavigateNote, onNewNote, isMobileMenuOpen }) => {
    return (
        <div className={`side-menu ${isMobileMenuOpen ? 'show' : ''}`}>
            <div className="side-header">
                <h1>Notes</h1>
                <span className="new-note" onClick={onNewNote}>&#43;</span>
            </div>
            <div id="note-titles">
                {loading && <p className="temp" style={{ color: "var(--secondary-color)" }}>Loading...</p>}
                {!loading && notes.length === 0 && <p className="temp" style={{ color: "var(--secondary-color)" }}>No Notes Yet</p>}
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className={`note-title ${activeNoteId === note.id ? "active" : ""}`}
                        id={`note-${note.id}`}
                        onClick={() => onNavigateNote(note.id)}
                    >
                        <h2>{note.Title}</h2>
                        <p>{note.when}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;