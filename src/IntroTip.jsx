/**
 * IntroTip — centred modal overlay shown until the user interacts.
 * Pointer-events are disabled so it doesn't block canvas clicks.
 *
 * Props:
 *   visible — bool
 */
export default function IntroTip({ visible }) {
  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position:       "fixed",
          top:            "50%",
          left:           "50%",
          transform:      "translate(-50%, -50%)",
          background:     "rgba(4,8,22,0.94)",
          border:         "1px solid rgba(100,150,220,0.32)",
          borderRadius:   14,
          padding:        "28px 40px",
          textAlign:      "center",
          zIndex:         60,
          backdropFilter: "blur(14px)",
          maxWidth:       420,
          pointerEvents:  "none",
          animation:      "fadeUp 0.5s ease",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>🪡</div>

        <div
          style={{
            color:         "#b0d0f8",
            fontSize:      20,
            marginBottom:  14,
            letterSpacing: "0.04em",
          }}
        >
          Stitched
        </div>

        <div style={{ color: "#6080b0", fontSize: 13, lineHeight: 2 }}>
          <span style={{ color: "#90c0f0" }}>Hold left click</span> — push needle through cloth
          <br />
          <span style={{ color: "#90c0f0" }}>Drag</span> — pull thread across to the exit hole
          <br />
          <span style={{ color: "#90c0f0" }}>Release</span> — stitch lands where you let go
          <br />
          <span style={{ color: "#90c0f0" }}>Hold right click + drag</span> — move the camera
          <br />
          <span style={{ color: "#90c0f0" }}>Scroll</span> — infinite zoom
          <br />
          <span style={{ color: "#c07050" }}>⊗</span>
          <span style={{ color: "#304060", fontSize: 11 }}> you cannot re-enter the hole you just exited</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
