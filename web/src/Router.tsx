import {
  Routes,
  Route,
  BrowserRouter,
  Navigate
} from "react-router";

import { Base, Home, NotFound } from "./templates";

export default function Router() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Base />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}