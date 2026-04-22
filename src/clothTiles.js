import { CELL, HOLE_R } from "./constants";

function hash2(x, y, seed) {
  // Deterministic 2D hash -> [0, 1)
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1442695041;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000000) / 1000000;
}

function makeRng(seed) {
  // xorshift32
  let s = (seed | 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

function makeTileCanvas(size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

function drawClothTile(ctx, worldX0, worldY0, size, seed) {
  const W = size;
  const H = size;

  const tileSeed =
    ((worldX0 / size) | 0) * 1973 +
    ((worldY0 / size) | 0) * 9277 +
    (seed | 0) * 26699;
  const rand = makeRng(tileSeed);

  // Base
  ctx.fillStyle = "#243654";
  ctx.fillRect(0, 0, W, H);

  const gx0 = Math.floor(worldX0 / CELL) - 2;
  const gy0 = Math.floor(worldY0 / CELL) - 2;
  const gx1 = Math.ceil((worldX0 + W) / CELL) + 2;
  const gy1 = Math.ceil((worldY0 + H) / CELL) + 2;

  // Warp threads (horizontal bands)
  for (let gRow = gy0; gRow <= gy1; gRow++) {
    const y = gRow * CELL - worldY0;
    for (let gCol = gx0; gCol <= gx1; gCol++) {
      const x = gCol * CELL - worldX0;
      const over = (gRow + gCol) % 2 === 0;
      const g = ctx.createLinearGradient(x, y, x, y + CELL);
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
      ctx.fillRect(x, y, CELL, CELL * 0.52);
    }
  }

  // Weft threads (vertical bands)
  for (let gCol = gx0; gCol <= gx1; gCol++) {
    const x = gCol * CELL - worldX0;
    for (let gRow = gy0; gRow <= gy1; gRow++) {
      const y = gRow * CELL - worldY0;
      const over = (gRow + gCol) % 2 === 1;
      const g = ctx.createLinearGradient(x, y, x + CELL, y);
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
      ctx.fillRect(x, y + CELL * 0.48, CELL * 0.52, CELL);
    }
  }

  // Thread-grid dividers
  ctx.strokeStyle = "rgba(10,20,50,0.55)";
  ctx.lineWidth = 0.8;
  for (let gCol = gx0; gCol <= gx1; gCol++) {
    const x = gCol * CELL - worldX0;
    if (x <= 0 || x >= W) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let gRow = gy0; gRow <= gy1; gRow++) {
    const y = gRow * CELL - worldY0;
    if (y <= 0 || y >= H) continue;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Subtle weave variation overlay (breaks up tiling)
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 120; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const len = 40 + rand() * 140;
    const ang = (rand() * 0.6 - 0.3) + (i % 2 === 0 ? Math.PI / 2 : 0);
    ctx.strokeStyle = i % 3 === 0 ? "#b9d6ff" : "#0b1731";
    ctx.lineWidth = 0.6 + rand() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Stray fibres (deterministic; sparse so tiles don't feel repetitive)
  for (let gRow = gy0; gRow <= gy1; gRow++) {
    for (let gCol = gx0; gCol <= gx1; gCol++) {
      const r = hash2(gCol, gRow, seed);
      if (r < 0.08) {
        const r2 = hash2(gCol, gRow, seed + 17);
        const r3 = hash2(gCol, gRow, seed + 33);
        const wx = (gCol * CELL - worldX0) + r2 * CELL;
        const wy = (gRow * CELL - worldY0) + r3 * CELL;
        const ang = (hash2(gCol, gRow, seed + 91) * Math.PI);
        const len = 6 + hash2(gCol, gRow, seed + 7) * 14;
        const a = 0.03 + hash2(gCol, gRow, seed + 123) * 0.08;
        ctx.strokeStyle = `rgba(160,200,255,${a})`;
        ctx.lineWidth = 0.4 + hash2(gCol, gRow, seed + 211) * 0.7;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(ang) * len, wy + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
  }

  // Holes at every intersection
  for (let gRow = gy0; gRow <= gy1; gRow++) {
    const hy = gRow * CELL - worldY0;
    if (hy < -HOLE_R - 6 || hy > H + HOLE_R + 6) continue;
    for (let gCol = gx0; gCol <= gx1; gCol++) {
      const hx = gCol * CELL - worldX0;
      if (hx < -HOLE_R - 6 || hx > W + HOLE_R + 6) continue;

      const sh = ctx.createRadialGradient(hx, hy, 0, hx, hy, HOLE_R + 5);
      sh.addColorStop(0,    "rgba(5,10,30,0.75)");
      sh.addColorStop(0.55, "rgba(5,10,30,0.28)");
      sh.addColorStop(1,    "rgba(5,10,30,0)");
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.arc(hx, hy, HOLE_R + 5, 0, Math.PI * 2); ctx.fill();

      const hg = ctx.createRadialGradient(hx - 1, hy - 1, 0.5, hx, hy, HOLE_R);
      hg.addColorStop(0,   "#080e22");
      hg.addColorStop(0.7, "#050a18");
      hg.addColorStop(1,   "#020610");
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, HOLE_R, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = "rgba(140,180,240,0.4)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(hx - 0.6, hy - 0.6, HOLE_R - 0.8, Math.PI * 1.05, Math.PI * 1.6);
      ctx.stroke();
    }
  }

  // Grain + dye noise (per-tile, deterministic)
  const imgd = ctx.getImageData(0, 0, W, H);
  const d = imgd.data;
  const r0 = 0.85 + rand() * 0.3;
  const g0 = 0.9 + rand() * 0.25;
  const b0 = 0.95 + rand() * 0.2;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    d[i]     = Math.max(0, Math.min(255, d[i]     * r0 + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * g0 + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * b0 + n));
  }
  ctx.putImageData(imgd, 0, 0);

  // Gentle vignette (makes center feel richer, edges less flat)
  const vg = ctx.createRadialGradient(W * 0.52, H * 0.48, W * 0.2, W * 0.5, H * 0.5, W * 0.9);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

export function createClothTileCache({ tileSize = 1024, seed = 1337 } = {}) {
  const tiles = new Map(); // key -> { canvas, worldX0, worldY0 }

  function getTile(tx, ty) {
    const key = `${tx},${ty}`;
    const existing = tiles.get(key);
    if (existing) return existing;

    const canvas = makeTileCanvas(tileSize);
    const ctx = canvas.getContext("2d");
    const worldX0 = tx * tileSize;
    const worldY0 = ty * tileSize;
    drawClothTile(ctx, worldX0, worldY0, tileSize, seed);

    const tile = { canvas, worldX0, worldY0 };
    tiles.set(key, tile);
    return tile;
  }

  function draw(ctx, viewX, viewY, viewportW, viewportH) {
    const x0 = viewX;
    const y0 = viewY;
    const x1 = viewX + viewportW;
    const y1 = viewY + viewportH;

    const tx0 = Math.floor(x0 / tileSize) - 1;
    const ty0 = Math.floor(y0 / tileSize) - 1;
    const tx1 = Math.floor(x1 / tileSize) + 1;
    const ty1 = Math.floor(y1 / tileSize) + 1;

    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = getTile(tx, ty);
        ctx.drawImage(t.canvas, t.worldX0, t.worldY0);
      }
    }
  }

  return { draw, tiles };
}
