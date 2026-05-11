type Rarities =
    | "common"
    | "uncommon"
    | "rare"
    | "epic"
    | "legendary"
    | "celestial"
    | "god"
    | "glitched"
    | "custom";

type InventoryItemProps = {
    weapon: string;
    skin?: string;
    rarity?: Rarities;
};

const RarityStyles: Record<Rarities, string> = {
    common: "bg-neutral-400",
    uncommon: "bg-lime-600",
    rare: "bg-blue-600",
    epic: "bg-purple-700",
    legendary: "bg-yellow-500",
    celestial: "bg-red-600",
    god: "bg-green-600",
    glitched: "",
    custom: "bg-cyan-300",
};

export default function InventoryItem({weapon, skin = "plancake", rarity = "common"}: InventoryItemProps) {
    return (
        <>
            <style>
                {`@keyframes bg-rainbow {
                    0% { background-color: hsl(0, 100%, 50%); }
                    10% { background-color: hsl(36, 100%, 50%); }
                    20% { background-color: hsl(72, 100%, 50%); }
                    30% { background-color: hsl(108, 100%, 50%); }
                    40% { background-color: hsl(144, 100%, 50%); }
                    50% { background-color: hsl(180, 100%, 50%); }
                    60% { background-color: hsl(216, 100%, 50%); }
                    70% { background-color: hsl(252, 100%, 50%); }
                    80% { background-color: hsl(288, 100%, 50%); }
                    90% { background-color: hsl(324, 100%, 50%); }
                    100% { background-color: hsl(360, 100%, 50%); }
                }`}
            </style>

            <div className="w-32 h-32 border-2 border-zinc-800 bg-zinc-700 rounded-lg overflow-hidden relative">
                {skin && (
                    <img src={`${skin}`} alt="Skin Image" className="absolute inset-0 w-full h-full object-contain z-0"/>
                )}

                <div className="absolute inset-0 z-10 p-0.5">
                    <div className={`w-full h-full ${RarityStyles[rarity]} rounded-sm`} style={{WebkitMaskImage: "url('/images/6fcf7350.png')", WebkitMaskSize: "cover", maskImage: "url('/images/6fcf7350.png')", maskSize: "cover", ... (rarity === "glitched" ? {animation: "bg-rainbow 10s linear infinite"} : {})}}/>
                </div>

                <div className="relative z-10 flex items-center justify-center h-full">
                    <img src={`/images/weapons/${weapon}.png`} alt="Item Icon" className="w-auto h-auto rounded-lg"/>
                </div>
            </div>
        </>
    );
};