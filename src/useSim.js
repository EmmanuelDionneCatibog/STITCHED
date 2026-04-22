import { useRef, useState, useCallback, useEffect } from "react";
import { snap, sameHole } from "./constants";

const STORAGE_KEY = "stitched.sim.v1";

/**
 * useSim — all mutable embroidery state lives in a ref (sim.current) so
 * the RAF render loop can read it without triggering React re-renders on
 * every frame.  React state is used only for the values the UI actually
 * needs to display.
 *
 * REALISM RULES enforced here:
 *  1. You cannot push the needle into the same hole it just came out of.
 *  2. Every drag produces exactly one "over" stitch visible on top of the
 *     cloth.  If the thread end (last exit hole) differs from the drag
 *     start (next entry hole), an under-stitch is auto-added to connect
 *     them, simulating the thread running underneath the fabric.
 *  3. Undo removes the last over-stitch and its connecting under-stitch
 *     (if any) as a single atomic operation.
 */
export function useSim(canvasRef) {
  // All per-frame mutable state — never triggers re-renders
  const sim = useRef({
    stitches:    [],   // { x1,y1, x2,y2, color, over }
    threadEnd:   null, // {x,y} — hole the needle last exited from
    dragStart:   null, // {x,y} — hole the current drag began at
    isDragging:  false,
    isPanning:   false,
    panStart:    null, // {x,y, camX, camY} — screen px + cam at pan start
    dragCurX:    0,    // raw canvas X of current mouse position
    dragCurY:    0,
    hoverX:      -999,
    hoverY:      -999,
    color:       "#C0392B",
    pulse:       0,
    // The hole the needle last came OUT of — cannot re-enter
    lastExitHole: null,
    // Camera offset in world px (top-left of viewport in world space)
    camX:        0,
    camY:        0,
  });

  // React state — only what the UI panels need
  const [stitchCount, setStitchCount] = useState(0);
  const [needlePos,   setNeedlePos]   = useState({ x: -999, y: -999 });
  const [isDragging,  setIsDragging]  = useState(false);
  const [showTip,     setShowTip]     = useState(true);
  const [flash,       setFlash]       = useState("");

  const didLoadRef = useRef(false);
  const persist = useCallback(() => {
    const s = sim.current;
    const payload = {
      stitches: s.stitches,
      threadEnd: s.threadEnd,
      lastExitHole: s.lastExitHole,
      camX: s.camX,
      camY: s.camY,
      color: s.color,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / privacy mode
    }
  }, []);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const s = sim.current;
      if (Array.isArray(data.stitches)) s.stitches = data.stitches;
      if (data.threadEnd && typeof data.threadEnd.x === "number") s.threadEnd = data.threadEnd;
      if (data.lastExitHole && typeof data.lastExitHole.x === "number") s.lastExitHole = data.lastExitHole;
      if (typeof data.camX === "number") s.camX = data.camX;
      if (typeof data.camY === "number") s.camY = data.camY;
      if (typeof data.color === "string") s.color = data.color;
      setStitchCount(s.stitches.filter(st => st && st.over).length);
      setShowTip(false);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // ── Flash message helper ─────────────────────────────────────────────────
  const flashTimerRef = useRef(null);
  const showFlash = useCallback((msg) => {
    setFlash(msg);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(""), 1400);
  }, []);

  // ── Mouse move ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    setNeedlePos({ x: e.clientX, y: e.clientY });
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const s  = sim.current;

    if (s.isPanning && s.panStart) {
      const dx = cx - s.panStart.x;
      const dy = cy - s.panStart.y;
      s.camX = s.panStart.camX - dx;
      s.camY = s.panStart.camY - dy;
    }

    const wx = cx + s.camX;
    const wy = cy + s.camY;
    const h  = snap(wx, wy);
    s.hoverX   = h.x;
    s.hoverY   = h.y;
    s.dragCurX = wx;
    s.dragCurY = wy;
  }, [canvasRef]);

  // ── Mouse leave ──────────────────────────────────────────────────────────
  const handleMouseLeave = useCallback(() => {
    setNeedlePos({ x: -999, y: -999 });
    const s   = sim.current;
    s.hoverX  = -999;
    s.hoverY  = -999;
    // Cancel any in-progress drag cleanly
    s.isDragging = false;
    s.dragStart  = null;
    s.isPanning  = false;
    s.panStart   = null;
    setIsDragging(false);
  }, []);

  // ── Mouse down ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    // Middle mouse = pan the camera (infinite cloth)
    if (e.button === 1) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const s  = sim.current;
      s.isPanning = true;
      s.panStart  = { x: cx, y: cy, camX: s.camX, camY: s.camY };
      return;
    }

    // Right mouse = pan the camera (preferred)
    if (e.button === 2) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const s  = sim.current;
      s.isPanning = true;
      s.panStart  = { x: cx, y: cy, camX: s.camX, camY: s.camY };
      return;
    }

    if (e.button !== 0) return;
    e.preventDefault();
    setShowTip(false);

    const s    = sim.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const h    = snap((e.clientX - rect.left) + s.camX, (e.clientY - rect.top) + s.camY);

    // RULE 1: cannot enter the same hole the needle just exited
    if (sameHole(h, s.lastExitHole)) {
      showFlash("Can't re-enter the same hole — move to a different one!");
      return;
    }

    s.dragStart  = h;
    s.dragCurX   = (e.clientX - rect.left) + s.camX;
    s.dragCurY   = (e.clientY - rect.top) + s.camY;
    s.isDragging = true;
    setIsDragging(true);
  }, [canvasRef, showFlash]);

  // ── Mouse up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e) => {
    const s = sim.current;

    if (e.button === 1) {
      s.isPanning = false;
      s.panStart  = null;
      persist();
      return;
    }

    if (e.button === 2) {
      s.isPanning = false;
      s.panStart  = null;
      persist();
      return;
    }

    if (e.button !== 0) return;
    if (!s.isDragging || !s.dragStart) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const end  = snap((e.clientX - rect.left) + s.camX, (e.clientY - rect.top) + s.camY);

    // Must release on a DIFFERENT hole from where the drag started
    if (sameHole(end, s.dragStart)) {
      s.isDragging = false;
      s.dragStart  = null;
      setIsDragging(false);
      return;
    }

    // RULE 1 (release side): cannot exit through the hole we entered from
    // (This prevents a zero-length "same hole" stitch after the first one.)
    // In practice the sameHole check above already catches most cases,
    // but we also guard the entry hole stored in threadEnd.
    // (Note: threadEnd is where the thread IS coming from under the cloth,
    //  not where the needle entered — both are valid exit points in reality,
    //  but we specifically block the *immediately preceding exit hole*.)

    // ── Commit: under-stitch connecting threadEnd → dragStart (if needed) ──
    if (s.threadEnd && !sameHole(s.threadEnd, s.dragStart)) {
      s.stitches.push({
        x1: s.threadEnd.x, y1: s.threadEnd.y,
        x2: s.dragStart.x, y2: s.dragStart.y,
        color: s.color,
        over:  false,
      });
    }

    // ── Commit: over-stitch (visible on top of cloth) ──────────────────────
    s.stitches.push({
      x1: s.dragStart.x, y1: s.dragStart.y,
      x2: end.x,         y2: end.y,
      color: s.color,
      over:  true,
    });

    // Update thread tracking
    s.lastExitHole = end;   // needle just exited here — cannot re-enter
    s.threadEnd    = end;
    setStitchCount(n => n + 1);
    persist();

    s.isDragging = false;
    s.dragStart  = null;
    setIsDragging(false);
  }, [canvasRef, persist]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const s = sim.current;
    if (!s.stitches.length) return;

    // Remove the last over-stitch
    const last = s.stitches[s.stitches.length - 1];
    if (last.over) {
      s.stitches.pop();
      // Also remove its preceding under-stitch connector if it exists
      const prev = s.stitches[s.stitches.length - 1];
      if (prev && !prev.over) s.stitches.pop();
    } else {
      s.stitches.pop();
    }

    // Restore thread state
    if (s.stitches.length === 0) {
      s.threadEnd    = null;
      s.lastExitHole = null;
    } else {
      const newLast  = s.stitches[s.stitches.length - 1];
      s.threadEnd    = { x: newLast.x2, y: newLast.y2 };
      s.lastExitHole = s.threadEnd;
    }

    setStitchCount(n => Math.max(0, n - 1));
    persist();
  }, [persist]);

  // ── Clear ────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const s      = sim.current;
    s.stitches   = [];
    s.threadEnd  = null;
    s.dragStart  = null;
    s.isDragging = false;
    s.lastExitHole = null;
    s.camX = 0;
    s.camY = 0;
    s.isPanning = false;
    s.panStart  = null;
    setIsDragging(false);
    setStitchCount(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return {
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
  };
}
