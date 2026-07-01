import * as SkinsType from "@/types/SkinsType.tsx";
import * as RarityType from "@/types/RarityType.tsx";

export const RarityStyles: RarityType.RarityObject[] = [
    {
        name: "Management",
        value: SkinsType.SkinsRarity.MANAGEMENT,
        class: "border-red-400/50 bg-red-500/15 text-red-300",
    },
    {
        name: "Admin",
        value: SkinsType.SkinsRarity.ADMIN,
        class: "border-indigo-400/50 bg-indigo-500/15 text-indigo-300",
    },
    {
        name: "Unattainable",
        value: SkinsType.SkinsRarity.UNATTAINABLE,
        class: "border-orange-400/50 bg-orange-500/15 text-orange-300",
    },
    {
        name: "Epic",
        value: SkinsType.SkinsRarity.EPIC,
        class: "border-purple-400/50 bg-purple-500/15 text-purple-300",
    },
    {
        name: "Rare",
        value: SkinsType.SkinsRarity.RARE,
        class: "border-blue-400/50 bg-blue-500/15 text-blue-300",
    },
    {
        name: "Uncommon",
        value: SkinsType.SkinsRarity.UNCOMMON,
        class: "border-green-400/50 bg-green-500/15 text-green-300",
    },
    {
        name: "Common",
        value: SkinsType.SkinsRarity.COMMON,
        class: "border-zinc-500/50 bg-zinc-500/15 text-zinc-300",
    },
    {
        name: "Uncategorized",
        value: SkinsType.SkinsRarity.UNCATEGORIZED,
        class: "border-white-700 bg-white-800/70 text-white-400",
    },
];