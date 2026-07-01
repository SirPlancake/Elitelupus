import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as LucideReact from "lucide-react";
import * as SidebarComponent from "@/components/SidebarComponent.tsx";

export type LayoutOutletContext = {
    SetTopbarContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
    SetFooterContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
};

export default function Layout() {
    const [SidebarVisible, setSidebarVisible] = React.useState(false);
    const [TopbarContent, SetTopbarContent] = React.useState<React.ReactNode>(null);
    const [FooterContent, SetFooterContent] = React.useState<React.ReactNode>(null);

    const OutletContext = React.useMemo<LayoutOutletContext>(() => {
        return {
            SetTopbarContent,
            SetFooterContent,
        };
    }, []);

    return (
        <div className="h-dvh custom-scrollbar overflow-hidden text-white p-3 flex flex-col bg-black bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[32px_32px]">
            <div className="flex items-center justify-between p-3 h-18 rounded-lg border mb-2 border-zinc-800/75 bg-zinc-900/75 md:hidden">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <div className="flex h-12 flex-1 items-center px-4 rounded-md bg-zinc-900/80 text-white font-bold border border-zinc-800/75 overflow-hidden">
                        <span className="font-semibold text-lg text-gray-200 truncate">
                            Elitelupus
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setSidebarVisible(!SidebarVisible)}
                    className="cursor-pointer relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-900/80 text-gray-300 font-bold border border-zinc-800/75 overflow-hidden transition-all duration-300 hover:bg-zinc-800/90 hover:text-white active:scale-95"
                >
                    <LucideReact.Menu className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${SidebarVisible ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}/>
                    <LucideReact.X className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${SidebarVisible ? "opacity-100 rotate-0 scale-100": "opacity-0 -rotate-90 scale-75"}`}/>
                </button>
            </div>

            <div className="flex flex-1 gap-3 relative min-h-0">
                <aside className="hidden md:block w-64 shrink-0">
                    <SidebarComponent.Sidebar/>
                </aside>

                <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 md:hidden ${SidebarVisible ? "translate-x-0" : "-translate-x-full"}`}>
                    <SidebarComponent.Sidebar/>
                </aside>

                {SidebarVisible && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setSidebarVisible(false)}
                    />
                )}

                <main className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-800/75 bg-zinc-900/75 overflow-hidden">
                    {TopbarContent && (
                        <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg min-h-20 flex flex-wrap items-center gap-3">
                            <div className="min-w-0 flex flex-1 flex-wrap items-center gap-3">
                                {TopbarContent}
                            </div>
                        </div>
                    )}

                    <div className="flex min-h-0 flex-1 flex-col p-3">
                        <ReactRouter.Outlet context={OutletContext}/>
                    </div>

                    {FooterContent && (
                        <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg min-h-16 flex flex-wrap items-center gap-3">
                            <div className="min-w-0 flex flex-1 flex-wrap items-center gap-3">
                                {FooterContent}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}