type Config = {
  API_URL: string;
  DISCORD_SERVER_URL: string,
  GAME_SERVER_CONNECT: string,
  STEAM_GROUP_URL: string,
  DEVELOPER_URL: string,
  GITHUB_URL: string,
};

const Development: Config = {
  API_URL: "http://localhost:3000",
  DISCORD_SERVER_URL: "https://discord.gg/cSKHbvUvbx",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  DEVELOPER_URL: "https://sirplancake.dev",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus"
};

const Production: Config = {
  API_URL: "https://api.sirplancake.dev",
  DISCORD_SERVER_URL: "https://discord.gg/cSKHbvUvbx",
  GAME_SERVER_CONNECT: "steam://connect/193.243.190.23:27015",
  STEAM_GROUP_URL: "https://steamcommunity.com/groups/ElitelupusGamingCommunity",
  DEVELOPER_URL: "https://sirplancake.dev",
  GITHUB_URL: "https://github.com/SirPlancake/Elitelupus"
};

export default import.meta.env.MODE === "development" ? Development : Production;