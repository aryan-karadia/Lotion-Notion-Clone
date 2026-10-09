const GuestBanner = ({ onExit = () => {}, onReset = () => {} }) => (
    <div className="guest-banner" role="status" aria-label="Guest mode">
        <div className="guest-banner-copy">
            <strong>Guest mode</strong>
            <span>Your notes are saved only in this browser.</span>
        </div>
        <div className="guest-banner-actions">
            <button type="button" onClick={onReset} className="guest-banner-button">
                Reset demo data
            </button>
            <button type="button" onClick={onExit} className="guest-banner-button guest-exit-button">
                Exit guest mode
            </button>
        </div>
    </div>
);

export default GuestBanner;
