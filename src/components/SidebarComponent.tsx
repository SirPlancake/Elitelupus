import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as Lucide from "lucide-react";
import * as SidebarType from "@/types/SidebarType.tsx";
import * as SidebarData from "@/data/SidebarData.ts";
import * as SpinnerComponent from "@/components/SpinnerComponent.tsx";
import * as SocketLib from "@/libs/SocketLib.ts";
import ConfigData from "@/data/ConfigData.ts";

export function SidebarStatus({Status}: {Status: SidebarType.SidebarStatus}) {
    const Badge = SidebarData.SidebarBadges.find((Badge) => Badge.internal_id === Status);
    if (!Badge) return null;

    return (
        <span className={`ml-auto shrink-0 rounded px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-white ${Badge.class}`}>
            {Badge.name}
        </span>
    );
};

export default function SidebarUsers() {
    const [OnlineUsers, setOnlineUsers] = React.useState(0);

    React.useEffect(() => {
        const Socket = SocketLib.GetSocket();

        if (!Socket.connected) {
            Socket.connect();
        };

        const HandleOnlineUsers = (Count: number) => {
            setOnlineUsers(Count);
        };

        Socket.on("OnlineUsers", HandleOnlineUsers);

        return () => {
            Socket.off("OnlineUsers", HandleOnlineUsers);
        };
    }, []);

    return (
        <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Lucide.Eye className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{OnlineUsers}</span>
        </span>
    );
};

export function Sidebar() {
    const Location = ReactRouter.useLocation();

    return (
        <aside className="h-full md:rounded-lg md:overflow-hidden border border-zinc-800/75 bg-zinc-900/75 shadow-lg flex flex-col">
            <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg flex items-center justify-center gap-3 h-20">
                <SpinnerComponent.Image src="/images/9f2c6e1a.png" alt="Elitelupus Logo" className="h-full w-full object-cover rounded-md"/>
            </div>

            <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
                {SidebarData.SidebarItems.map(({name: Name, icon: Icon, children: Children}) => (
                    <div key={Name} className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 rounded-lg border border-zinc-900 bg-zinc-950/50 p-1.5 py-1.5 text-sm font-semibold text-white/80">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-900 bg-zinc-950/60 text-white/60">
                                <Icon className="h-4 w-4"/>
                            </div>

                            <span className="flex-1 min-w-0 truncate">{Name}</span>
                        </div>

                        <div className="ml-1 mt-1 flex flex-col gap-1">
                            {Children.map(({name: ChildName, uri: ChildURI, icon: ChildIcon, status: Status}) => {
                                const ChildActive = Location.pathname === ChildURI;

                                return (
                                    <div key={ChildName} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2">
                                        <div className="relative">
                                            <span className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px -translate-x-1/2 bg-zinc-800/80"/>

                                            {ChildActive && (
                                                <span className="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400"/>
                                            )}
                                        </div>

                                        <ReactRouter.Link to={ChildURI} className={`group flex min-w-0 items-center gap-2 overflow-hidden rounded-md px-2.5 py-2 text-sm font-medium transition ${ChildActive ? "bg-zinc-800/90 text-white" : "text-white/45 hover:bg-zinc-950/50 hover:text-white/90"}`}>
                                            <ChildIcon className={`h-4 w-4 shrink-0 transition ${ChildActive ? "text-indigo-300" : "text-white/35 group-hover:text-white/70"}`}/>

                                            <span className="min-w-0 flex-1 truncate">
                                                {ChildName}
                                            </span>

                                            <SidebarStatus Status={Status}/>
                                        </ReactRouter.Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm whitespace-nowrap">

                <span className="inline-flex items-center gap-1.5 font-mono">
                    <Lucide.GitCompare className="h-3.5 w-3.5 text-zinc-500"/>
                    <span>{`${import.meta.env.MODE === "development" ? "DEV" : "PROD"}-`}
                        <a href={`${ConfigData.GITHUB_URL}/commit/${COMMIT_HASH}`} className="text-blue-400 hover:underline">
                            {COMMIT_HASH}
                        </a>
                    </span>
                </span>

                <span className="text-zinc-600">&bull;</span>
                    <SidebarUsers/>
                </div>
            </div>

            <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                <div className="flex w-full gap-2">
                    {SidebarData.SidebarLinks.slice(0, 4).map(({ name: Name, url: URL, icon: Icon, special: Special }) => (
                        <a key={Name} href={URL} title={Name} target="_blank" rel="noopener noreferrer" className={`flex flex-1 h-10 items-center justify-center rounded-md border transition ${Special ? "animate-pulse border-yellow-500/60 bg-yellow-500/10 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.15)]" : "border-zinc-800 bg-zinc-900 text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white"}`}>
                            <Icon className="h-5 w-5"/>
                        </a>
                    ))}
                </div>
            </div>
        </aside>
    );
};