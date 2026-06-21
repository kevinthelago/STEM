import React from "react";
import ReactDOM from "react-dom/client";

// Entry point — app shell is owned by frontend-core and will mount here.
// This stub satisfies the Vite build until AppShell lands.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>STEM</h1>
      <p>Loading…</p>
    </div>
  </React.StrictMode>
);
