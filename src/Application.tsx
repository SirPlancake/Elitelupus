import {StrictMode} from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import ReactDOM from "react-dom/client";

import Layout from "./Layout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Gallery from "./pages/Gallery.tsx";
import Viewer from "./pages/Viewer.tsx";
import Lookup from "./pages/Lookup.tsx";

import "./assets/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/gallery" element={<Gallery/>}/>
          <Route path="/viewer" element={<Viewer/>}/>
          <Route path="/lookup" element={<Lookup/>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);