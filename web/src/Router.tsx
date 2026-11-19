import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";

import { Base, Home, NotFound, Explore, AboutUs, Download } from "./templates";

export default function Router() {
  return (
    // On GitHub Pages the site lives under /Build-Inspector/ (vite.config.ts sets the base).
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Routes>
        <Route path="/" element={<Base />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="download" element={<Download />} />
          <Route path="download/:platform" element={<Navigate to="/download" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
