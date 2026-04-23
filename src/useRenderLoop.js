import { useEffect, useRef, useCallback } from "react";
import { snap, HOLE_R } from "./constants";
import { createClothTileCache } from "./clothTiles";

/**
 * useRenderLoop — drives the animationFrame render loop.
 *
 * Draws:
 *  1. Under-stitches (behind the cloth image)
 *  2. The cloth texture (blitted from offscreen canvas)
 *  3. Over-stitches (on top of cloth, with shadow + highlight)
 *  4. Drag preview (animated dashed line + glowing holes)
 *  5. Thread-end glow and hover ring (when not dragging)
 *  6. "Blocked hole" red pulse when hovering over lastExitHole
 */
export function useRenderLoop(canvasRef, sim) {
  const rafRef = useRef(null);
  const clothCacheRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const s   = sim.current;
    s.pulse   = (s.pulse + 0.045) % (Math.PI * 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const z = typeof s.zoom === "number" && s.zoom > 0 ? s.zoom : 1;
    ctx.setTransform(z, 0, 0, z, -s.camX * z, -s.camY * z);

    // ── 1. Under-stitches (behind cloth) ──────────────────────────────────
    s.stitches.forEach(st => {
      if (st.over) return;
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = st.color + "88";
      ctx.lineWidth   = 2.2;
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.stroke();
      ctx.restore();
    });

    // ── 2. Cloth texture ───────────────────────────────────────────────────
    if (!clothCacheRef.current) clothCacheRef.current = createClothTileCache();
    clothCacheRef.current.draw(ctx, s.camX, s.camY, canvas.width / z, canvas.height / z);

    // ── 3. Over-stitches ──────────────────────────────────────────────────
    s.stitches.forEach(st => {
      if (!st.over) return;
      ctx.save();

      // Drop shadow
      ctx.shadowColor   = "rgba(0,0,0,0.55)";
      ctx.shadowBlur    = 5;
      ctx.shadowOffsetY = 1.8;

      // Thread body — slightly rounded, with slight width variation to look
      // hand-stitched rather than perfectly uniform
      ctx.strokeStyle = st.color;
      ctx.lineWidth   = 4.4;
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.stroke();

      // Reset shadow for sheen
      ctx.shadowBlur    = 0;
      ctx.shadowOffsetY = 0;

      // Sheen highlight
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.stroke();

      ctx.restore();
    });

    // ── 4. Drag preview ───────────────────────────────────────────────────
    if (s.isDragging && s.dragStart) {
      const hSnap = snap(s.dragCurX, s.dragCurY);
      const isSameHole = hSnap.x === s.dragStart.x && hSnap.y === s.dragStart.y;

      // Dashed connector from last threadEnd to drag start
      if (s.threadEnd && (s.threadEnd.x !== s.dragStart.x || s.threadEnd.y !== s.dragStart.y)) {
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = s.color + "50";
        ctx.lineWidth   = 1.8;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(s.threadEnd.x, s.threadEnd.y);
        ctx.lineTo(s.dragStart.x, s.dragStart.y);
        ctx.stroke();
        ctx.restore();
      }

      // Animated preview line
      if (!isSameHole) {
        const alpha = 0.42 + 0.38 * Math.sin(s.pulse * 3);
        ctx.save();
        ctx.setLineDash([7, 4]);
        ctx.strokeStyle = s.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth   = 3.5;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(s.dragStart.x, s.dragStart.y);
        ctx.lineTo(hSnap.x, hSnap.y);
        ctx.stroke();
        ctx.restore();
      }

      // Glow on entry hole
      const p = 0.5 + 0.5 * Math.sin(s.pulse * 3);
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.dragStart.x, s.dragStart.y, HOLE_R + 7, 0, Math.PI * 2);
      ctx.fillStyle = s.color + Math.round(p * 160).toString(16).padStart(2, "0");
      ctx.fill();
      ctx.restore();

      // Glow on exit hole target
      if (!isSameHole) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(hSnap.x, hSnap.y, HOLE_R + 5, 0, Math.PI * 2);
        ctx.fillStyle = s.color + Math.round(p * 100).toString(16).padStart(2, "0");
        ctx.fill();
        ctx.restore();
      }

    } else {
      // ── 5. Thread-end glow (needle parked here) ─────────────────────────
      if (s.threadEnd) {
        const p = 0.5 + 0.5 * Math.sin(s.pulse * 2);
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.threadEnd.x, s.threadEnd.y, HOLE_R + 5, 0, Math.PI * 2);
        ctx.fillStyle = s.color + Math.round(p * 130).toString(16).padStart(2, "0");
        ctx.fill();
        ctx.restore();
      }

      // ── 6. Hover ring / blocked-hole indicator ───────────────────────────
      if (s.hoverX > -900) {
        const hSnap    = snap(s.hoverX, s.hoverY);
        const blocked  = s.lastExitHole &&
                         hSnap.x === s.lastExitHole.x &&
                         hSnap.y === s.lastExitHole.y;

        const p2 = 0.55 + 0.45 * Math.sin(s.pulse * 2);

        if (blocked) {
          // Red pulsing X indicator on the forbidden hole
          ctx.save();
          ctx.beginPath();
          ctx.arc(hSnap.x, hSnap.y, HOLE_R + 7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.4 * Math.sin(s.pulse * 4)})`;
          ctx.lineWidth   = 2;
          ctx.stroke();

          // Draw a small X in the hole
          const d = 5;
          ctx.strokeStyle = `rgba(255,80,60,${0.7 + 0.3 * Math.sin(s.pulse * 4)})`;
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.moveTo(hSnap.x - d, hSnap.y - d);
          ctx.lineTo(hSnap.x + d, hSnap.y + d);
          ctx.moveTo(hSnap.x + d, hSnap.y - d);
          ctx.lineTo(hSnap.x - d, hSnap.y + d);
          ctx.stroke();
          ctx.restore();
        } else {
          // Normal hover ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(s.hoverX, s.hoverY, HOLE_R + 6, 0, Math.PI * 2);
          ctx.strokeStyle = s.color + Math.round(p2 * 190).toString(16).padStart(2, "0");
          ctx.lineWidth   = 1.8;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(render);
  }, [canvasRef, sim]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);
}
