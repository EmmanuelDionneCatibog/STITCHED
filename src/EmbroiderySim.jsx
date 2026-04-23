import { useRef, useState, useEffect } from "react";

import { THREAD_COLORS, snap, sameHole } from "./constants";
import { useRenderLoop }                 from "./useRenderLoop";
import { useSim }                        from "./useSim";

import NeedleSVG      from "./NeedleSVG";
import ThreadPalette  from "./ThreadPalette";
import StatusBar      from "./StatusBar";
import Controls       from "./Controls";
import IntroTip       from "./IntroTip";
import FlashMessage   from "./FlashMessage";

export default function EmbroiderySim() {
  // ── Canvas refs ──────────────────────────────────────────────────────────
  const canvasRef = useRef(null);   // onscreen  — animated render target

  // ── Thread colour selection ──────────────────────────────────────────────
  const COLOR_KEY = "stitched.color.v1";
  const [selectedColor, setSelectedColor] = useState(() => {
    try {
      const hex = localStorage.getItem(COLOR_KEY);
      const found = THREAD_COLORS.find(c => c.hex === hex);
      return found || THREAD_COLORS[0];
    } catch {
      return THREAD_COLORS[0];
    }
  });

  // ── Simulation state & handlers ──────────────────────────────────────────
  const {
    sim,
    stitchCount,
    needlePos,
    isDragging,
    showTip,
    flash,
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
    handleWheel,
    zoomLevel,
    setZoomLevel,
    handleUndo,
    handleClear,
  } = useSim(canvasRef);

  const handleSavePng = () => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `stitched-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleClearAll = () => {
    const ok = window.confirm("Clear all stitches? This cannot be undone.");
    if (!ok) return;
    handleClear();
  };

  // Keep sim colour in sync with UI selection
  useEffect(() => {
    sim.current.color = selectedColor.hex;
    try { localStorage.setItem(COLOR_KEY, selectedColor.hex); } catch {}
  }, [selectedColor, sim]);

  // Keep canvas sized to the window
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Determine if hover is over the blocked hole (for StatusBar) ──────────
  const hSnap   = snap(sim.current.hoverX, sim.current.hoverY);
  const isBlocked = !isDragging &&
                    sim.current.hoverX > -900 &&
                    sameHole(hSnap, sim.current.lastExitHole);

  // ── RAF render loop ───────────────────────────────────────────────────────
  useRenderLoop(canvasRef, sim);

  return (
    <div
      style={{
        width:      "100vw",
        height:     "100vh",
        overflow:   "hidden",
        background: "#0c1425",
        fontFamily: "Georgia, 'Times New Roman', serif",
        userSelect: "none",
        position:   "relative",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Main render canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "none" }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}
        onContextMenu={e => e.preventDefault()}
      />

      {/* ── Needle cursor — tip pinned to mouse ─────────────────────────── */}
      <div
        style={{
          position:      "fixed",
          left:          needlePos.x - 11,
          top:           needlePos.y - 46,
          width:         22,
          height:        50,
          pointerEvents: "none",
          zIndex:        200,
          transform:     isDragging ? "translateY(6px) scale(0.88)" : "none",
          transition:    "transform 0.08s ease",
        }}
      >
        <NeedleSVG color={selectedColor.hex} dragging={isDragging} />
      </div>

      {/* ── UI panels ───────────────────────────────────────────────────── */}
      <ThreadPalette selectedColor={selectedColor} onSelect={setSelectedColor} />

      <StatusBar
        selectedColor={selectedColor}
        stitchCount={stitchCount}
        isDragging={isDragging}
        isBlocked={isBlocked}
      />

      <Controls
        onUndo={handleUndo}
        onClear={handleClearAll}
        onSave={handleSavePng}
        zoomLevel={zoomLevel}
        onZoomLevel={setZoomLevel}
      />

      <IntroTip visible={showTip} />

      <FlashMessage message={flash} />
    </div>
  );
}
