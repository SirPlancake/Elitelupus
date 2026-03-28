import {Toaster} from "@/components/ui/sonner";
import {useState} from "react";
import {Outlet} from "react-router-dom";
import {Menu, X} from "lucide-react";
import Sidebar from "./components/custom/Sidebar.tsx";

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh text-white p-3 flex flex-col bg-black bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[32px_32px]">
      <div className="flex items-center justify-between p-3 h-18 rounded-lg border mb-2 border-zinc-800/75 bg-zinc-900/75 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-lime-500/80 text-white font-bold border border-zinc-800/75 overflow-hidden">
            <img src="/images/cfda44bf.png" alt="Elitelupus Logo" className="h-full w-full object-cover"/>
          </div>

          <span className="font-semibold text-lg ml-1 text-gray-200">Elitelupus</span>
        </div>

        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-white/80 hover:text-white transition">
          {isSidebarOpen ? <X/> : <Menu/>}
        </button>
      </div>

      <div className="flex flex-1 gap-3 relative">
        <aside className="hidden md:block w-64 shrink-0">
          <Sidebar/>
        </aside>

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar/>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}/>
        )}

        <div className="flex flex-col flex-1 gap-3 overflow-y-auto">
          <Outlet/>
          <div className="absolute inset-0 pointer-events-none z-9999">
            <Toaster richColors position="top-right" />
          </div>
        </div>
      </div>
    </div>
  );
}