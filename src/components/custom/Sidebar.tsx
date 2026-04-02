import {Unplug, House, Box, Image} from "lucide-react";
import {FaSteam, FaDiscord, FaGithub} from "react-icons/fa";
import {useLocation, Link} from "react-router-dom";
import Config from "../../../vite.app.config.ts";

const TopActions = [
  {name: "Home", uri: "/", icon: House, status: "DEV"},
  {name: "Gallery", uri: "/gallery", icon: Image, status: "NONE"},
  {name: "Model Viewer", uri: "/viewer", icon: Box, status: "BETA"},
];

const BottomActions = [
  {name: "Connect", url: Config.GAME_SERVER_CONNECT, icon: Unplug, mobile: false},
  {name: "Discord", url: Config.DISCORD_SERVER_URL, icon: FaDiscord, mobile: true},
  {name: "Steam", url: Config.STEAM_GROUP_URL, icon: FaSteam, mobile: true},
  {name: "Github", url: Config.GITHUB_URL, icon: FaGithub, mobile: true},
];

export default function Sidebar() {
  const Location = useLocation();

  return (
    <aside className="h-full rounded-lg border border-zinc-800/75 bg-zinc-900/75 shadow-lg flex flex-col justify-between">
      <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg flex items-center justify-center gap-3 h-20">
        <img src="/images/54d7fb53.png" alt="Elitelupus Logo" className="h-full w-full object-cover rounded-md"/>
      </div>

      <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
        {TopActions.map(({name: Name, uri: URI, icon: Icon, status: Status}) => {
          const IsActive = Location.pathname === URI;

          return (
            <Link key={Name} to={URI} className={`flex items-center gap-3 rounded-md px-2 py-2 text-md font-medium transition ${IsActive ? "bg-zinc-800 text-white" : "text-white/70 hover:border-white/10 hover:bg-zinc-950/60 hover:text-white"}`}>
              <Icon className="h-5 w-5 text-white/80 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{Name}</span>
              {Status && Status !== "NONE" && ["DEV", "NEW", "BETA"].includes(Status) && (
                <span className={`ml-auto shrink-0 min-w-12 max-w-12 overflow-hidden text-ellipsis whitespace-nowrap text-center rounded-sm px-2 py-0.5 text-xs font-semibold text-white ${Status === "DEV" ? "bg-red-500/80" : Status === "NEW" ? "bg-green-400/80" : Status === "BETA" ? "bg-indigo-500/80" : ""}`}>
                  {Status}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950/50 p-3">
        <div className="text-gray-400 text-sm text-center whitespace-nowrap">
          Running on {`${import.meta.env.MODE === "development" ? "DEV" : "PROD"}-`}
          <a href={`${Config.GITHUB_URL}/commit/${COMMIT_HASH}`} className="text-blue-400 hover:underline">{COMMIT_HASH}</a>
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
        <div className="flex w-full gap-2">
          {BottomActions.slice(0, 4).map(({name: Name, url: URL, icon: Icon, mobile: IsMobile}) => (
            <a key={Name} href={URL} title={Name} className={`flex flex-1 h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white ${!IsMobile ? "md:pointer-events-auto md:opacity-100 pointer-events-none opacity-40" : ""}`}>
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}