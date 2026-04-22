// Grid spacing between holes (px)
export const CELL = 34;

// Hole radius (px)
export const HOLE_R = 5;

// DMC thread colour palette
export const THREAD_COLORS = [
  { name: "Crimson",   hex: "#C0392B", dmc: "321"   },
  { name: "Rose",      hex: "#E91E8C", dmc: "602"   },
  { name: "Coral",     hex: "#E8735A", dmc: "351"   },
  { name: "Tangerine", hex: "#F39C12", dmc: "741"   },
  { name: "Goldenrod", hex: "#D4AC0D", dmc: "783"   },
  { name: "Sage",      hex: "#7D9E6B", dmc: "3364"  },
  { name: "Forest",    hex: "#27AE60", dmc: "909"   },
  { name: "Teal",      hex: "#1ABC9C", dmc: "959"   },
  { name: "Sky",       hex: "#5DADE2", dmc: "519"   },
  { name: "Navy",      hex: "#2471A3", dmc: "312"   },
  { name: "Violet",    hex: "#8E44AD", dmc: "550"   },
  { name: "Lavender",  hex: "#A98DC0", dmc: "210"   },
  { name: "Chocolate", hex: "#795548", dmc: "801"   },
  { name: "Ivory",     hex: "#F5F0E8", dmc: "Ecru"  },
  { name: "Gold",      hex: "#FFD700", dmc: "742"   },
  { name: "White",     hex: "#FFFFFF", dmc: "Blanc" },
];

// Snap a canvas coordinate to the nearest hole centre
export function snap(x, y) {
  return {
    x: Math.round(x / CELL) * CELL,
    y: Math.round(y / CELL) * CELL,
  };
}

// Are two hole objects the same grid position?
export function sameHole(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}
