export default function LoadingOverlay({ show, title, sub }) {
    return (
        <div
            className={`loading-overlay${show ? ' show' : ''}`}
            id="loading-overlay"
            role="status"
            aria-live="polite"
            aria-hidden={show ? 'false' : 'true'}
        >
            <div className="loading-card">
                <div className="loader-ring" />
                <div className="loader-text">{title}</div>
                <div className="loader-sub">{sub}</div>
            </div>
        </div>
    );
}
