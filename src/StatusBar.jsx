/**
 * StatusBar — centred pill at the top of the screen showing thread colour,
 * stitch count, and a hint about the current needle state.
 *
 * Props:
 *   selectedColor — THREAD_COLORS entry
 *   stitchCount   — number
 *   isDragging    — bool
 *   isBlocked     — bool, true when hovering over the forbidden re-entry hole
 */
export default function StatusBar({ selectedColor, stitchCount, isDragging, isBlocked }) {
  let hint;
  if (isBlocked) {
    hint = <span style={{ color: "#ff5040", fontSize: 10, fontStyle: "italic" }}>⊗ can't re-enter that hole</span>;
  } else if (isDragging) {
    hint = <span style={{ color: "#70e090", fontSize: 10, fontStyle: "italic" }}>▼ stitching — release to set</span>;
  } else {
    hint = (
      <span style={{ color: "#e0a040", fontSize: 10, fontStyle: "italic" }}>
        ▲ left drag to stitch · right drag to pan · scroll to zoom
      </span>
    );
  }

  return (
    <div
      style={{
        position:       "fixed",
        top:            14,
        left:           "50%",
        transform:      "translateX(-50%)",
        background:     "rgba(6,12,26,0.9)",
        border:         "1px solid rgba(100,150,220,0.18)",
        borderRadius:   20,
        padding:        "6px 18px",
        zIndex:         50,
        backdropFilter: "blur(8px)",
        display:        "flex",
        alignItems:     "center",
        gap:            11,
        fontSize:       11,
        letterSpacing:  "0.07em",
        whiteSpace:     "nowrap",
      }}
    >
      <span style={{ color: "#3a5070" }}>THREAD:</span>

      <span
        style={{
          display:      "inline-block",
          width:        10,
          height:       10,
          borderRadius: "50%",
          background:   selectedColor.hex,
          boxShadow:    `0 0 5px ${selectedColor.hex}`,
        }}
      />

      <span style={{ color: "#90b8e0" }}>{selectedColor.name}</span>

      <span style={{ color: "#1e3050" }}>|</span>

      <span style={{ color: "#3a5070" }}>STITCHES:</span>
      <span style={{ color: "#90b8e0" }}>{stitchCount}</span>

      <span style={{ color: "#1e3050" }}>|</span>

      {hint}
    </div>
  );
}

