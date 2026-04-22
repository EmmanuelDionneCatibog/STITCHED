/**
 * NeedleSVG — an embroidery needle rendered as inline SVG.
 *
 * The TIP of the needle is at the bottom-centre of the 22×50 viewport (11, 50).
 * The parent <div> must be positioned so that pixel (11, 50) lands exactly on
 * the mouse cursor:
 *   left = mouseX - 11
 *   top  = mouseY - 46    (tip is at y=50, but we offset 4px up for the point)
 *
 * Props:
 *   color    — hex string of the currently selected thread colour
 *   dragging — bool, whether the needle is currently pushed through the cloth
 */
export default function NeedleSVG({ color, dragging }) {
  return (
    <svg width="22" height="50" viewBox="0 0 22 50" style={{ display: "block" }}>
      <defs>
        {/* Gold metallic gradient for the shaft */}
        <linearGradient id="needle-shaft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#a89050" />
          <stop offset="28%"  stopColor="#e8dba8" />
          <stop offset="58%"  stopColor="#c8b870" />
          <stop offset="100%" stopColor="#988840" />
        </linearGradient>
      </defs>

      {/* Shaft */}
      <rect x="9" y="6" width="4" height="36" rx="2" fill="url(#needle-shaft)" />

      {/* Shaft sheen */}
      <rect x="10.2" y="7" width="1.2" height="32" rx="0.6"
            fill="rgba(255,252,220,0.42)" />

      {/* Pointed tip */}
      <polygon points="11,50 9.2,40 12.8,40" fill="#d0c480" />
      <polygon points="11,50 10.4,40 11.6,40" fill="rgba(255,248,200,0.45)" />

      {/* Eye of the needle */}
      <ellipse cx="11" cy="7.5" rx="3.2" ry="2.2" fill="#988040" />
      <ellipse cx="11" cy="7.5" rx="1.9"  ry="1.3"  fill="#1e1408" />

      {/* Thread through the eye — dangling above */}
      <line x1="11" y1="0" x2="11" y2="6"
            stroke={color} strokeWidth="1.6" strokeDasharray="2,2" opacity="0.95" />
      <line x1="11" y1="0" x2="3" y2="-10"
            stroke={color} strokeWidth="1.2" strokeDasharray="2,3" opacity="0.6" />

      {/* Glint near the tip when needle is pushed in */}
      {dragging && (
        <ellipse cx="11" cy="43" rx="2" ry="1.4"
                 fill="rgba(255,255,200,0.65)" />
      )}
    </svg>
  );
}
