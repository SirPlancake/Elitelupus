export type ModelObject = {
  id: number;
  name: string;
  path: string;
  type: number;
};

export const ModelTypes: Record<ModelObject["type"], string> = {
  0: "Suit",
  1: "Weapon"
};

export const ModelOrders: Record<number, number> = {
  0: 0,
  1: 1
};