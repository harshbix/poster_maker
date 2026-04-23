import { APP_META } from '../config/appConfig';

export default function Header({ formatLabel, imageCount }) {
    return (
        <header className="app-header">
            <div className="brand-lockup">
                <div className="logo-mark" aria-hidden="true">PM</div>
                <div>
                    <div className="logo-text">{APP_META.name}</div>
                    <p className="header-subtitle">{APP_META.tagline}</p>
                </div>
            </div>

            <div className="header-stats" aria-label="Workspace summary">
                <div className="header-pill">
                    <span className="header-pill-label">Canvas</span>
                    <span className="header-pill-value">{formatLabel}</span>
                </div>
                <div className="header-pill">
                    <span className="header-pill-label">Images</span>
                    <span className="header-pill-value">{imageCount}</span>
                </div>
            </div>
        </header>
    );
}
