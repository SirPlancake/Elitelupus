export const SkinsRarity = {
    MANAGEMENT: 0,
    ADMIN: 1,
    UNATTAINABLE: 2,
    EPIC: 3,
    RARE: 4,
    UNCOMMON: 5,
    COMMON: 6,
    UNCATEGORIZED: 7
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