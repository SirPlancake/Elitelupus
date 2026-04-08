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
  3: "Rebranded"
};

export const SkinOrders: Record<number, number> = {
  1: 0,
  3: 1,
  2: 2,
  0: 3
};