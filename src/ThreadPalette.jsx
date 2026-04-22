import { THREAD_COLORS } from "./constants";

/**
 * ThreadPalette — vertical strip of colour swatches on the right edge.
 * Clicking a swatch selects that thread colour.
 *
 * Props:
 *   selectedColor  — the currently active THREAD_COLORS entry
 *   onSelect       — callback(colorEntry)
 */
export default function ThreadPalette({ selectedColor, onSelect }) {
  return (
    <div
      style={{
        position:        "fixed",
        right:           14,
        top:             "50%",
        transform:       "translateY(-50%)",
        background:      "rgba(6,12,26,0.94)",
        backdropFilter:  "blur(10px)",
        border:          "1px solid rgba(100,150,220,0.22)",
        borderRadius:    12,
        padding:         "12px 9px",
        display:         "flex",
        flexDirection:   "column",
        gap:             6,
        zIndex:          50,
        boxShadow:       "0 8px 32px rgba(0,0,0,0.7)",
      }}
    >
      {/* Label */}
      <div
        style={{
          color:          "#6080b0",
          fontSize:       9,
          letterSpacing:  "0.16em",
          textTransform:  "uppercase",
          textAlign:      "center",
          marginBottom:   4,
        }}
      >
        Thread
      </div>

      {/* Swatches */}
      {THREAD_COLORS.map(c => (
        <div
          key={c.hex}
          title={`${c.name} · DMC ${c.dmc}`}
          onClick={() => onSelect(c)}
          style={{
            width:      22,
            height:     22,
            borderRadius: "50%",
            background: c.hex,
            cursor:     "pointer",
            border:     selectedColor.hex === c.hex
                          ? "2.5px solid #c0d4f4"
                          : "2px solid rgba(255,255,255,0.07)",
            boxShadow:  selectedColor.hex === c.hex
                          ? `0 0 10px ${c.hex}, 0 0 3px rgba(255,255,255,0.25)`
                          : "0 1px 4px rgba(0,0,0,0.55)",
            transition: "all 0.12s ease",
            transform:  selectedColor.hex === c.hex ? "scale(1.2)" : "scale(1)",
          }}
        />
      ))}

      {/* Selected colour info */}
      <div
        style={{
          marginTop:   8,
          borderTop:   "1px solid rgba(100,150,220,0.14)",
          paddingTop:  8,
        }}
      >
        <div
          style={{
            width:      22,
            height:     7,
            borderRadius: 4,
            background: selectedColor.hex,
            margin:     "0 auto 4px",
            boxShadow:  `0 0 7px ${selectedColor.hex}99`,
          }}
        />
        <div style={{ color: "#5070a0", fontSize: 8, textAlign: "center" }}>
          {selectedColor.name}
        </div>
        <div style={{ color: "#3a5070", fontSize: 7, textAlign: "center" }}>
          DMC {selectedColor.dmc}
        </div>
      </div>
    </div>
  );
}
