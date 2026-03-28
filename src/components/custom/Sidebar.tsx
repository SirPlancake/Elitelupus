import {Unplug, House, Box, Image} from "lucide-react";
import {FaSteam, FaDiscord, FaGithub} from "react-icons/fa";
import {useLocation} from "react-router-dom";
import Config from "../../../vite.app.config.ts";

const TopActions = [
  {name: "Home", uri: "/", icon: House, status: "DEV"},
  {name: "Gallery", uri: "/gallery", icon: Image, status: "NEW"},
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
        {TopActions.map(({name, uri, icon: Icon, status}) => {
          const IsActive = Location.pathname === uri;

          return (
            <a key={name} href={uri} className={`flex items-center gap-3 rounded-md px-2 py-2 text-md font-medium transition ${IsActive ? "bg-zinc-800 text-white" : "text-white/70 hover:border-white/10 hover:bg-zinc-950/60 hover:text-white"}`}>
              <Icon className="h-5 w-5 text-white/80" />
              <span className="transition-colors duration-200 group-hover:text-white">{name}</span>
              {status == "DEV" && (
                <span className="min-w-11 text-center ml-auto rounded-sm bg-red-500/80 px-2 py-0.5 text-xs font-semibold text-white">
                  DEV
                </span>
              )}

              {status == "NEW" && (
                <span className="min-w-11 text-center ml-auto rounded-sm bg-green-400/80 px-2 py-0.5 text-xs font-semibold text-white">
                  NEW
                </span>
              )}

              {status == "BETA" && (
                <span className="min-w-11 text-center ml-auto rounded-sm bg-indigo-500/80 px-2 py-0.5 text-xs font-semibold text-white">
                  BETA
                </span>
              )}
            </a>
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
          {BottomActions.slice(0, 4).map(({name, url, icon: Icon, mobile}) => (
            <a key={name} href={url} title={name} className={`flex flex-1 h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white ${!mobile ? "md:pointer-events-auto md:opacity-100 pointer-events-none opacity-40" : ""}`}>
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}