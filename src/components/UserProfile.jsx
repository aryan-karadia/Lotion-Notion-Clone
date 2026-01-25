import { useState } from "react";
import { useAppSelector } from "../stores/hooks";
import { CgProfile } from "react-icons/cg";


const UserProfile = ({ handleLogout }) => {
    const user = useAppSelector((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="user-profile">
            <div onClick={() => { setIsMenuOpen(!isMenuOpen); console.log(isMenuOpen); }} >
                <CgProfile className="user-avatar" />
            </div>
            {isMenuOpen && (
                <div className="user-menu">
                    <span className="user-email">{user.email}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserProfile;