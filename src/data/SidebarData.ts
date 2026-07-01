import * as Lucide from "lucide-react";
import * as ReactIcons from "react-icons/fa";
import * as SidebarType from "@/types/SidebarType";
import ConfigData from "./ConfigData.ts";

export const SidebarItems: SidebarType.SidebarItemObject[] = [
    {
        name: "Dashboard",
        icon: Lucide.House,
        children: [
            {
                name: "Overview",
                uri: "/",
                icon: Lucide.House,
                status: SidebarType.SidebarStatus.DEV
            },
            {
                name: "Staff Roster",
                uri: "/staff-roster",
                icon: Lucide.Shield,
                status: SidebarType.SidebarStatus.DEV
            },
        ],
    },
    {
        name: "Cosmetic",
        icon: Lucide.Image,
        children: [
            {
                name: "Gallery",
                uri: "/gallery",
                icon: Lucide.Image,
                status: SidebarType.SidebarStatus.NEW
            },
            {
                name: "Model Viewer",
                uri: "/model-viewer",
                icon: Lucide.Box,
                status: SidebarType.SidebarStatus.NEW
            },
        ],
    },
    {
        name: "Miscellaneous",
        icon: Lucide.Box,
        children: [
            {
                name: "Steam Lookup",
                uri: "/steam-lookup",
                icon: Lucide.Search,
                status: SidebarType.SidebarStatus.DEV
            },
        ],
    },
];

export const SidebarLinks: SidebarType.SidebarLinkObject[] = [
    {
        name: "Discord",
        url: ConfigData.DISCORD_SERVER_URL,
        icon: ReactIcons.FaDiscord,
        special: false
    },
    {
        name: "Steam",
        url: ConfigData.STEAM_GROUP_URL,
        icon: ReactIcons.FaSteam,
        special: false
    },
    {
        name: "Github",
        url: ConfigData.GITHUB_URL,
        icon: ReactIcons.FaGithub,
        special: false
    },
    {
        name: "Donate",
        url: ConfigData.DONATE_URL,
        icon: ReactIcons.FaHandshake,
        special: true
    },
];

export const SidebarBadges: SidebarType.SidebarBadgeObject[] = [
    {
        name: "NEW",
        internal_id: SidebarType.SidebarStatus.NEW,
        class: "bg-green-500/80",
    },
    {
        name: "DEV",
        internal_id: SidebarType.SidebarStatus.DEV,
        class: "bg-red-500/80",
    },
    {
        name: "BETA",
        internal_id: SidebarType.SidebarStatus.BETA,
        class: "bg-indigo-500/80",
    },
];