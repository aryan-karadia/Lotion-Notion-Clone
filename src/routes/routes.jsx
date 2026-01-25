import { Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import Notes from "../pages/Notes";
import Edit from "../pages/Edit";
import NoteView from "../pages/NoteView";
import { ProtectedRoute, ProtectedNoteRoute } from "./ProtectedRoutes";

/**
 * Create application routes with authentication and note validation guards
 * @param {Object} params - Route parameters
 * @param {string} params.email - User email
 * @param {string} params.token - Access token
 * @param {Function} params.logout - Logout handler
 * @param {boolean} params.isLoggedIn - Whether user is logged in
 * @param {Array} params.notes - Array of user notes
 * @returns {Array} Route configuration array
 */
export const createRoutes = ({ email, token, logout, isLoggedIn, notes }) => {
    return [
        {
            element: <Layout email={email} logout={logout} token={token} />,
            children: [
                {
                    path: "/",
                    element: isLoggedIn ? <Navigate to="/Notes" /> : <Navigate to="/" />,
                },
                {
                    path: "/Notes",
                    element: (
                        <ProtectedRoute isLoggedIn={isLoggedIn}>
                            <Notes />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/Notes/:id",
                    element: (
                        <ProtectedNoteRoute isLoggedIn={isLoggedIn} notes={notes}>
                            <NoteView email={email} token={token} />
                        </ProtectedNoteRoute>
                    ),
                },
                {
                    path: "/Notes/:id/edit",
                    element: (
                        <ProtectedNoteRoute isLoggedIn={isLoggedIn} notes={notes}>
                            <Edit email={email} token={token} />
                        </ProtectedNoteRoute>
                    ),
                },
                {
                    path: "*",
                    element: <Navigate to="/Notes" replace />,
                },
            ],
        },
    ];
};
