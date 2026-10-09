const startGuestSession = () => {
    // The session owner listens for this event so this UI stays independent of auth state.
    window.dispatchEvent(new CustomEvent("lotion:guest-login"));
};

const GuestLoginButton = ({ onStartGuest = startGuestSession }) => (
    <section className="guest-entry" aria-labelledby="guest-entry-title">
        <h2 id="guest-entry-title">Just looking around?</h2>
        <p>Try Lotion with a private demo workspace. No account or Google access is required.</p>
        <button type="button" className="guest-login-button" onClick={onStartGuest}>
            Try the demo as a guest
        </button>
        <p className="guest-entry-note">Your demo notes stay in this browser and can be reset any time.</p>
    </section>
);

export default GuestLoginButton;
