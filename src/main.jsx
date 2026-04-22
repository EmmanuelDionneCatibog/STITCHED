import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EmbroiderySim from "./EmbroiderySim";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EmbroiderySim />
  </StrictMode>
);
