import {type Config} from "@/types/Config.ts";

const Development: Config = {
  API_URL: "https://70a9e783.sirplancake.dev",
  DISCORD_SERVER_URL: "https://discord.gg/cSKHbvUvbx",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus"
};

const Production: Config = {
  API_URL: "https://api.sirplancake.dev",
  DISCORD_SERVER_URL: "https://discord.gg/cSKHbvUvbx",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus"
};

export default import.meta.env.MODE === "development" ? Development : Production;