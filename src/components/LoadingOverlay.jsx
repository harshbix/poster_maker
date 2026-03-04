export default function LoadingOverlay({ show, title, sub }) {
    return (
        <div className={`loading-overlay${show ? ' show' : ''}`} id="loading-overlay">
            <div className="loader-ring" />
            <div className="loader-text">{title}</div>
            <div className="loader-sub">{sub}</div>
        </div>
    );
}
