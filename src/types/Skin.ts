export type SkinObject = {
  id: number;
  name: string;
  internal_id: string;
  steam_id: string;
  discord_id: string;
  image_url: string;
  type: number;
};

export const SkinTypes: Record<SkinObject["type"], string> = {
  0: "Management",
  1: "Admin",
  2: "Unattainable",
  3: "Epic",
  4: "Rare",
  5: "Uncommon",
  6: "Common",
  7: "Uncategorized",
};

export const SkinColors: Record<SkinObject["type"], string> = {
  0: "text-lime-500",
  1: "text-indigo-500",
  2: "text-orange-500",
  3: "text-purple-500",
  4: "text-blue-500",
  5: "text-green-500",
  6: "text-gray-500",
  7: "text-white-500",
};

export const SkinOrders: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
};