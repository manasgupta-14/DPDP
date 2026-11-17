// Background me kuch tairte glass ke gole (prompt: "a few floating glass orbs").
// Sirf CSS transform animation: halka aur tez; text ke peeche bahut halke rehte hain.
export default function GlassOrbs() {
    return (
        <div className="kv-orbs" aria-hidden="true">
            <span className="kv-orb is-a" />
            <span className="kv-orb is-b" />
            <span className="kv-orb is-c" />
            <span className="kv-orb is-d" />
        </div>
    );
}
