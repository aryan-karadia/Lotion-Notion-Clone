import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute - Guards routes that require authentication
 * Redirects to login if user is not logged in
 */
export const ProtectedRoute = ({ children, isLoggedIn, mode, email }) => {
    const location = useLocation();
    const hasSession = isLoggedIn || (email && (mode === "google" || mode === "guest"));

    if (!hasSession) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }
    return children;
};

/**
 * ProtectedNoteRoute - Guards routes that require authentication
 * Note validation is handled by the individual page components
 */
export const ProtectedNoteRoute = ({ children, isLoggedIn, mode, email }) => {
    const location = useLocation();

    // Check if user is logged in
    const hasSession = isLoggedIn || (email && (mode === "google" || mode === "guest"));
    if (!hasSession) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};