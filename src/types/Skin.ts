export type SkinObject = {
  id: number;
  name: string;
  internal_id: string;
  steam_id: string;
  discord_id: string;
  image_url: string;
  texture_url: string;
  type: number;
};

export const SkinTypes: Record<SkinObject["type"], string> = {
  0: "Basic",
  1: "Management",
  2: "Unobtainable",
  3: "Rebranded",
  4: "Admin"
};

export const SkinColors: Record<SkinObject["type"], string> = {
  0: "text-gray-500",
  1: "text-lime-500",
  2: "text-orange-500",
  3: "text-purple-500",
  4: "text-indigo-500"
};

export const SkinOrders: Record<number, number> = {
  1: 0,
  3: 1,
  2: 2,
  0: 3
};