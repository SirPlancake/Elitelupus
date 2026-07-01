import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as ReactDOM from "react-dom/client";

import Layout from "./Layout.tsx";
import OverviewPage from "@/pages/dashboard/OverviewPage.tsx";
import StaffRosterPage from "@/pages/dashboard/StaffRosterPage.tsx";
import GalleryPage from "@/pages/cosmetic/GalleryPage.tsx";
import ModelViewerPage from "@/pages/cosmetic/ModelViewerPage.tsx";
import SteamLookupPage from "@/pages/miscellaneous/SteamLookupPage.tsx";
import NotFoundPage from "@/pages/NotFoundPage.tsx";

import "./assets/Styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ReactRouter.BrowserRouter>
            <ReactRouter.Routes>
                <ReactRouter.Route element={<Layout/>}>
                    <ReactRouter.Route path="/" element={<OverviewPage/>}/>
                    <ReactRouter.Route path="/staff-roster" element={<StaffRosterPage/>}/>
                    <ReactRouter.Route path="/gallery" element={<GalleryPage/>}/>
                    <ReactRouter.Route path="/model-viewer" element={<ModelViewerPage/>}/>
                    <ReactRouter.Route path="/steam-lookup" element={<SteamLookupPage/>}/>
                    <ReactRouter.Route path="*" element={<NotFoundPage/>}/>
                </ReactRouter.Route>
            </ReactRouter.Routes>
        </ReactRouter.BrowserRouter>
    </React.StrictMode>
);