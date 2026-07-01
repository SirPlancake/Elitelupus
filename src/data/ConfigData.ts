import * as ConfigType from "@/types/ConfigType.tsx";

const Development: ConfigType.ConfigObject = {
  API_URL: "https://70a9e783.sirplancake.dev",
  DISCORD_SERVER_URL: "https://discord.gg/nJaZeCkYmS",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus",
  DONATE_URL: "https://github.com/sponsors/SirPlancake"
};

const Production: ConfigType.ConfigObject = {
  API_URL: "/api",
  DISCORD_SERVER_URL: "https://discord.gg/nJaZeCkYmS",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus",
  DONATE_URL: "https://github.com/sponsors/SirPlancake"
};

export default import.meta.env.MODE === "development" ? Development : Production;