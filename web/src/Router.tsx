import {
  Routes,
  Route,
  BrowserRouter,
  Navigate
} from "react-router";

import { Base, Home, NotFound, Explore, AboutUs } from "./templates";

export default function Router() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Base />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="*" element={<NotFound />} />
          <Route path="download">
            <Route path="windows" />
            <Route path="linux" />
            <Route path="mac-os" />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}