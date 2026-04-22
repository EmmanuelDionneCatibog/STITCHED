import { useRef, useState, useEffect } from "react";

import { THREAD_COLORS, snap, sameHole } from "./constants";
import { useClothTexture }               from "./useClothTexture";
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
  const clothRef  = useRef(null);   // offscreen — cloth texture only
  const canvasRef = useRef(null);   // onscreen  — animated render target

  // ── Thread colour selection ──────────────────────────────────────────────
  const [selectedColor, setSelectedColor] = useState(THREAD_COLORS[0]);

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
    handleUndo,
    handleClear,
  } = useSim(canvasRef);

  // Keep sim colour in sync with UI selection
  useEffect(() => {
    sim.current.color = selectedColor.hex;
  }, [selectedColor, sim]);

  // ── Cloth texture (drawn once to offscreen canvas) ───────────────────────
  useClothTexture(clothRef);

  // ── Determine if hover is over the blocked hole (for StatusBar) ──────────
  const hSnap   = snap(sim.current.hoverX, sim.current.hoverY);
  const isBlocked = !isDragging &&
                    sim.current.hoverX > 0 &&
                    sameHole(hSnap, sim.current.lastExitHole);

  // ── RAF render loop ───────────────────────────────────────────────────────
  useRenderLoop(canvasRef, clothRef, sim);

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
    >
      {/* Offscreen cloth-texture canvas — never rendered directly */}
      <canvas
        ref={clothRef}
        width={1600}
        height={1000}
        style={{ display: "none" }}
      />

      {/* Main render canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ display: "block", cursor: "none" }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
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

      <Controls onUndo={handleUndo} onClear={handleClear} />

      <IntroTip visible={showTip} />

      <FlashMessage message={flash} />
    </div>
  );
}
