/**
 * FlashMessage — brief error/info toast that appears at the bottom centre.
 *
 * Props:
 *   message — string; empty string means hidden
 */
export default function FlashMessage({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position:     "fixed",
        bottom:       80,
        left:         "50%",
        transform:    "translateX(-50%)",
        background:   "rgba(160,30,20,0.93)",
        color:        "#fff",
        padding:      "9px 22px",
        borderRadius: 9,
        fontSize:     13,
        letterSpacing: "0.04em",
        zIndex:       160,
        pointerEvents: "none",
        boxShadow:    "0 4px 16px rgba(0,0,0,0.5)",
        animation:    "flashIn 0.15s ease",
      }}
    >
      {message}
      <style>{`
        @keyframes flashIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
