import {StrictMode} from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import ReactDOM from "react-dom/client";

import Layout from "./Layout.tsx";
import Home from "./pages/Home.tsx";
import Viewer from "./pages/Viewer.tsx";

import "./assets/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/" element={<Home/>} />
          <Route path="/viewer" element={<Viewer/>} />
          <Route path="*" element={<Navigate to="/" replace/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);