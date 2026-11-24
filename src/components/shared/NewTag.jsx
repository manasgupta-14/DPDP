export default function NewTag({ show, className = "" }) {
    if (!show) return null;
    return <span className={`kv-new-tag ${className}`}>New</span>;
}
