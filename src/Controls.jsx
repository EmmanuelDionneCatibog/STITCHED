/**
 * Controls — Undo and Clear buttons pinned to the bottom-centre.
 *
 * Props:
 *   onUndo  — callback
 *   onClear — callback
 */
export default function Controls({ onUndo, onClear, onSave, zoomLevel = 3, onZoomLevel }) {
  const _buttons = [
    { label: "↩ Undo",   fn: onUndo,  accent: "#6090c8" },
    { label: "✕ Clear",  fn: onClear, accent: "#c06050" },
    { label: "â‡© Save PNG", fn: onSave, accent: "#70c0a0" },
  ];

  const buttons = [
    { label: "Undo",      fn: onUndo,  accent: "#6090c8" },
    { label: "Clear All", fn: onClear, accent: "#c06050" },
    { label: "Save PNG",  fn: onSave,  accent: "#70c0a0" },
  ];

  return (
    <div
      style={{
        position:  "fixed",
        bottom:    20,
        left:      "50%",
        transform: "translateX(-50%)",
        display:   "flex",
        flexDirection: "column",
        alignItems: "center",
        gap:       10,
        zIndex:    50,
      }}
    >
      <div
        style={{
          background:     "rgba(6,12,26,0.92)",
          border:         "1px solid rgba(100,150,220,0.18)",
          color:          "#90b8e0",
          padding:        "8px 12px",
          borderRadius:   10,
          backdropFilter: "blur(8px)",
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          fontSize:       10,
          letterSpacing:  "0.08em",
        }}
      >
        <span style={{ color: "#3a5070" }}>ZOOM</span>
        <input
          type="range"
          min={0.1}
          max={12}
          step={0.01}
          value={zoomLevel}
          onChange={(e) => onZoomLevel?.(Number(e.target.value))}
          style={{ width: 140 }}
        />
        <span style={{ width: 48, textAlign: "right", color: "#90b8e0" }}>
          {Number(zoomLevel).toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {buttons.map(({ label, fn, accent }) => (
          <button
            key={label}
            onClick={fn}
            style={{
              background:     "rgba(6,12,26,0.92)",
              border:         `1px solid ${accent}50`,
              color:          accent,
              padding:        "7px 18px",
              borderRadius:   8,
              cursor:         "pointer",
              fontFamily:     "Georgia, serif",
              fontSize:       12,
              letterSpacing:  "0.07em",
              backdropFilter: "blur(8px)",
              transition:     "border-color 0.14s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${accent}50`)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
