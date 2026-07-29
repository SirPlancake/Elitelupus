export const SkinsRarity = {
    MANAGEMENT: 0,
    ADMIN: 1,
    USER: 2,
    UNATTAINABLE: 3,
    EPIC: 4,
    RARE: 5,
    UNCOMMON: 6,
    COMMON: 7,
    UNCATEGORIZED: 8
};

export type SkinsRarity = typeof SkinsRarity[keyof typeof SkinsRarity];

export type SkinsObject = {
    name: string;
    internal_id: string;
    steam_id: string;
    discord_id: string | null;
    file_path: string;
    type: SkinsRarity;
    created_at: number | null;
};