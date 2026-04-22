import { useEffect } from "react";
import { CELL, HOLE_R } from "./constants";

/**
 * Draws a woven blue Aida cloth texture (once) onto an offscreen canvas.
 * The canvas is never shown directly — it is blitted into the main render loop.
 */
export function useClothTexture(clothRef) {
  useEffect(() => {
    const c = clothRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const W = c.width;
    const H = c.height;

    // ── Base ────────────────────────────────────────────────────────────────
    ctx.fillStyle = "#243654";
    ctx.fillRect(0, 0, W, H);

    // ── Warp threads (horizontal bands) ────────────────────────────────────
    for (let row = 0; row < H / CELL + 1; row++) {
      const y = row * CELL;
      for (let col = 0; col < W / CELL + 1; col++) {
        const x    = col * CELL;
        const over = (row + col) % 2 === 0;
        const g    = ctx.createLinearGradient(x, y, x, y + CELL);
        if (over) {
          g.addColorStop(0,    "#3a5a8a");
          g.addColorStop(0.25, "#4a78b8");
          g.addColorStop(0.5,  "#3d6aa0");
          g.addColorStop(0.75, "#2d5285");
          g.addColorStop(1,    "#1e3d6a");
        } else {
          g.addColorStop(0,   "#1e3060");
          g.addColorStop(0.5, "#253870");
          g.addColorStop(1,   "#1a2855");
        }
        ctx.fillStyle = g;
        ctx.fillRect(x, y, CELL + 1, CELL * 0.52);
      }
    }

    // ── Weft threads (vertical bands) ──────────────────────────────────────
    for (let col = 0; col < W / CELL + 1; col++) {
      const x = col * CELL;
      for (let row = 0; row < H / CELL + 1; row++) {
        const y    = row * CELL;
        const over = (row + col) % 2 === 1;
        const g    = ctx.createLinearGradient(x, y, x + CELL, y);
        if (over) {
          g.addColorStop(0,   "#3060a0");
          g.addColorStop(0.3, "#4a80c8");
          g.addColorStop(0.6, "#3870b0");
          g.addColorStop(1,   "#224880");
        } else {
          g.addColorStop(0,   "#1a2e58");
          g.addColorStop(0.5, "#223565");
          g.addColorStop(1,   "#182850");
        }
        ctx.fillStyle = g;
        ctx.fillRect(x, y + CELL * 0.48, CELL * 0.52, CELL + 1);
      }
    }

    // ── Thread-grid dividers ────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(10,20,50,0.55)";
    ctx.lineWidth   = 0.8;
    for (let i = 0; i <= W / CELL + 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0);  ctx.lineTo(i * CELL, H); ctx.stroke();
    }
    for (let j = 0; j <= H / CELL + 1; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(W, j * CELL); ctx.stroke();
    }

    // ── Stray fibres ────────────────────────────────────────────────────────
    for (let i = 0; i < 2200; i++) {
      const wx  = Math.random() * W;
      const wy  = Math.random() * H;
      const ang = Math.random() * Math.PI;
      const len = 5 + Math.random() * 16;
      ctx.strokeStyle = `rgba(160,200,255,${0.03 + Math.random() * 0.09})`;
      ctx.lineWidth   = 0.4 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(ang) * len, wy + Math.sin(ang) * len);
      ctx.stroke();
    }

    // ── Holes at every intersection ─────────────────────────────────────────
    for (let row = 0; row <= Math.ceil(H / CELL) + 1; row++) {
      for (let col = 0; col <= Math.ceil(W / CELL) + 1; col++) {
        const hx = col * CELL;
        const hy = row * CELL;

        // Soft shadow around hole
        const sh = ctx.createRadialGradient(hx, hy, 0, hx, hy, HOLE_R + 5);
        sh.addColorStop(0,    "rgba(5,10,30,0.75)");
        sh.addColorStop(0.55, "rgba(5,10,30,0.28)");
        sh.addColorStop(1,    "rgba(5,10,30,0)");
        ctx.fillStyle = sh;
        ctx.beginPath(); ctx.arc(hx, hy, HOLE_R + 5, 0, Math.PI * 2); ctx.fill();

        // Dark hole fill
        const hg = ctx.createRadialGradient(hx - 1, hy - 1, 0.5, hx, hy, HOLE_R);
        hg.addColorStop(0,   "#080e22");
        hg.addColorStop(0.7, "#050a18");
        hg.addColorStop(1,   "#020610");
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(hx, hy, HOLE_R, 0, Math.PI * 2); ctx.fill();

        // Rim highlight (top-left arc)
        ctx.strokeStyle = "rgba(140,180,240,0.4)";
        ctx.lineWidth   = 0.9;
        ctx.beginPath();
        ctx.arc(hx - 0.6, hy - 0.6, HOLE_R - 0.8, Math.PI * 1.05, Math.PI * 1.6);
        ctx.stroke();
      }
    }

    // ── Grain noise ─────────────────────────────────────────────────────────
    const imgd = ctx.getImageData(0, 0, W, H);
    const d    = imgd.data;
    for (let i = 0; i < d.length; i += 4) {
      const n  = (Math.random() - 0.5) * 16;
      d[i]     = Math.max(0, Math.min(255, d[i]     + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(imgd, 0, 0);
  }, [clothRef]);
}
