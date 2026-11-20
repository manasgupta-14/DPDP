// Naye (abhi tak na khole gaye) card / row par chhota "New" tag. Item khulte hi hat jata hai.
export default function NewTag({ show, className = "" }) {
    if (!show) return null;
    return <span className={`kv-new-tag ${className}`}>New</span>;
}
