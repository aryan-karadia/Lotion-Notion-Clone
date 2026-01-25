import { Navigate, useParams } from "react-router-dom";

/**
 * ProtectedRoute - Guards routes that require authentication
 * Redirects to login if user is not logged in
 */
export const ProtectedRoute = ({ children, isLoggedIn }) => {
    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }
    return children;
};

/**
 * ProtectedNoteRoute - Guards routes that require both authentication and a valid note ID
 * Checks if user is logged in and if the requested note exists in the store
 * Redirects to /Notes if either condition fails
 */
export const ProtectedNoteRoute = ({ children, isLoggedIn, notes }) => {
    const { id } = useParams();
    const noteId = parseInt(id, 10);

    // Check if user is logged in
    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    // Check if note with the given ID exists
    const noteExists = notes.some((note) => note.id === noteId);
    if (!noteExists) {
        return <Navigate to="/Notes" replace />;
    }

    return children;
};
