export default function ToastRegion({ toasts }) {
    if (!toasts.length) return null;

    return (
        <div className="toast-region" aria-live="polite" aria-atomic="true">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
                    <div className="toast-title">{toast.title}</div>
                    {toast.message && <div className="toast-message">{toast.message}</div>}
                </div>
            ))}
        </div>
    );
}
