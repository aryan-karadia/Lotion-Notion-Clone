import { useAppSelector } from "../stores/hooks";

const UserProfile = ({ handleLogout }) => {
    const user = useAppSelector((state) => state.user);

    return (
        <div className="user-profile">
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
                Logout
            </button>
        </div>
    );
}

export default UserProfile;