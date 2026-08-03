import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as Lucide from "lucide-react";
import * as SkinsData from "@/data/SkinsData.ts";
import * as RarityData from "@/data/RarityData.ts";
import * as SkinsType from "@/types/SkinsType.tsx";
import * as SpinnerComponent from "@/components/SpinnerComponent.tsx";
import type {LayoutOutletContext} from "@/Layout.tsx";

const SKINS_PER_PAGE = 12;

function GetRarity(Type: SkinsType.SkinsRarity) {
    return RarityData.RarityStyles.find((Rarity) => Rarity.value === Type) ?? RarityData.RarityStyles[RarityData.RarityStyles.length - 1];
};

function FilterDropdown({SelectedRarity, SetSelectedRarity}: {SelectedRarity: SkinsType.SkinsRarity | null; SetSelectedRarity: React.Dispatch<React.SetStateAction<SkinsType.SkinsRarity | null>>}) {
    const [Open, SetOpen] = React.useState(false);
    const DropdownRef = React.useRef<HTMLDivElement | null>(null);
    const Selected = RarityData.RarityStyles.find((Rarity) => Rarity.value === SelectedRarity);

    React.useEffect(() => {
        function HandleClick(Event: MouseEvent) {
            if (!DropdownRef.current) return;
            if (!DropdownRef.current.contains(Event.target as Node)) {
                SetOpen(false);
            };
        };

        document.addEventListener("mousedown", HandleClick);

        return () => {
            document.removeEventListener("mousedown", HandleClick);
        };
    }, []);

    return (
        <div ref={DropdownRef} className="relative w-full md:w-auto">
            <button type="button" onClick={() => SetOpen((Value) => !Value)} className={`flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm font-semibold transition md:w-52 ${Open ? "border-zinc-700 bg-zinc-950 text-white" : "text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/90"}`}>
                <span className="min-w-0 truncate">
                    {Selected ? Selected.name : "None"}
                </span>

                <Lucide.ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition ${Open ? "rotate-180 text-zinc-300" : ""}`}/>
            </button>

            {Open && (
                <div className="absolute right-0 z-30 mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl shadow-black/50 md:w-60">
                    <button type="button" onClick={() => {SetSelectedRarity(null); SetOpen(false)}}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${SelectedRarity === null ? "bg-zinc-800 font-medium text-white" : "text-zinc-400 hover:bg-zinc-900"}`}>
                        <span className="flex h-2.5 w-2.5 shrink-0 rounded-full border border-zinc-500/60 bg-zinc-500/10"/>

                        <span className="min-w-0 flex-1">
                            <span className="block truncate">
                                None
                            </span>

                            <span className="block truncate text-[10px] text-zinc-500">
                                {SkinsData.Skins.length} skin{SkinsData.Skins.length === 1 ? "" : "s"}
                            </span>
                        </span>

                        {SelectedRarity === null && <Lucide.Check className="h-4 w-4 shrink-0 text-indigo-400"/>}
                    </button>

                    {RarityData.RarityStyles.filter((Rarity) => Rarity.value !== SkinsType.SkinsRarity.UNCATEGORIZED).map((Rarity) => {
                        const IsSelected = SelectedRarity === Rarity.value;
                        const SkinCount = SkinsData.Skins.filter((Skin) => Skin.type === Rarity.value).length;

                        return (
                            <button key={Rarity.name} type="button" onClick={() => {SetSelectedRarity(Rarity.value); SetOpen(false)}} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${IsSelected ? "bg-zinc-800 font-medium text-white" : "text-zinc-400 hover:bg-zinc-900"}`}>
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${Rarity.class}`}/>

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate">
                                        {Rarity.name}
                                    </span>

                                    <span className="block truncate text-[10px] text-zinc-500">
                                        {SkinCount} skin{SkinCount === 1 ? "" : "s"}
                                    </span>
                                </span>

                                {IsSelected && <Lucide.Check className="h-4 w-4 shrink-0 text-indigo-400"/>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function SkinModal({Skin, Closing, OnClose}: {Skin: SkinsType.SkinsObject; Closing: boolean; OnClose: () => void}) {
    const Rarity = GetRarity(Skin.type);
    const [CopiedField, SetCopiedField] = React.useState<string | null>(null);

    React.useEffect(() => {
        function HandleKey(Event: KeyboardEvent) {
            if (Event.key === "Escape") {
                OnClose();
            };
        };

        document.addEventListener("keydown", HandleKey);

        return () => {
            document.removeEventListener("keydown", HandleKey);
        };
    }, [OnClose]);

    const SteamID = ["", "N/A"].includes(Skin.steam_id.trim()) ? "N/A" : Skin.steam_id;
    const DiscordID = Skin.discord_id === null ? "N/A" : Skin.discord_id;

    const Rows = [
        {Label: "Rarity", Value: Rarity.name},
        {Label: "Internal ID", Value: Skin.internal_id},
        {Label: "Steam ID", Value: SteamID},
        {Label: "Discord ID", Value: DiscordID},
        {Label: "File Path", Value: Skin.file_path},
        {Label: "Created", Value: Skin.created_at !== null ? new Date(Skin.created_at * 1000).toLocaleString() : "N/A"},
    ];

    async function CopyValue(Label: string, Value: string) {
        try {
            await navigator.clipboard.writeText(Value);
            SetCopiedField(Label);

            window.setTimeout(() => {
                SetCopiedField(null);
            }, 1200);
        } catch {
            SetCopiedField(null);
        };
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm ${Closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"}`} onClick={OnClose}/>

            <div className={`relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 ${Closing ? "animate-modal-panel-out" : "animate-modal-panel-in"}`}>
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800/75 px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                Skin Details
                            </span>
                        </div>

                        <h2 className="mt-1.5 truncate text-lg font-bold tracking-tight text-white">
                            {Skin.name}
                        </h2>
                    </div>

                    <button type="button" onClick={OnClose} title="Close" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white">
                        <Lucide.X className="h-5 w-5"/>
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:h-full sm:min-h-0">
                            <SpinnerComponent.Image src={`/images/skins/${Skin.file_path}`} alt={Skin.name} className="h-full w-full"/>
                        </div>

                        <div className="flex min-w-0 flex-col gap-2.5">
                            {Rows.map(({Label, Value}) => {
                                const IsCopied = CopiedField === Label;

                                return (
                                    <div key={Label} className="flex items-center gap-2 rounded-lg border border-zinc-800/75 bg-zinc-900/60 px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                {Label}
                                            </div>

                                            <div className="mt-1 truncate font-mono text-sm text-zinc-200">
                                                {Value}
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => CopyValue(Label, Value)} title={`Copy ${Label}`} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-500 transition hover:bg-white/10 hover:text-white">
                                            {IsCopied ? <Lucide.Check className="h-3.5 w-3.5 text-green-400"/> : <Lucide.Copy className="h-3.5 w-3.5"/>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2 border-t border-zinc-800/75 px-4 py-4">
                    <ReactRouter.Link to={`/model-viewer?skin=${encodeURIComponent(Skin.name)}`} onClick={OnClose} className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400">
                        <Lucide.ExternalLink className="h-4 w-4"/>
                        Open Model Viewer
                    </ReactRouter.Link>
                </div>
            </div>
        </div>
    );
};

function SkinCard({Skin, OnClick}: {Skin: SkinsType.SkinsObject; OnClick: () => void}) {
    const Rarity = GetRarity(Skin.type);

    return (
        <article className="group relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-800/75 bg-zinc-900 shadow-md xl:h-full">
            <button type="button" onClick={OnClick} title={`View Details: ${Skin.name}`} className="relative flex aspect-square flex-none cursor-pointer items-center justify-center overflow-hidden bg-zinc-950 text-left xl:aspect-auto xl:h-full xl:min-h-0 xl:flex-1">
                <SpinnerComponent.Image src={`/images/skins/${Skin.file_path}`} alt={Skin.name} className="h-full w-full transition duration-300 group-hover:scale-105"/>

                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-black/90 via-black/45 to-transparent"/>

                    <div className="absolute inset-x-1.5 top-1.5 z-20 flex items-center justify-between gap-2">
                        <span className={`inline-flex h-6 items-center rounded-sm border px-2 text-[9px] font-black uppercase tracking-[0.14em] ${Rarity.class}`}>
                            {Rarity.name}
                        </span>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-linear-to-t from-black/95 via-black/50 to-transparent"/>

                    <div className="absolute inset-x-2.5 bottom-2 z-20 min-w-0">
                        <span className="block truncate text-sm font-bold text-white drop-shadow">
                            {Skin.name}
                        </span>
                    </div>
            </button>
        </article>
    );
};

export default function Page() {
    const [Search, SetSearch] = React.useState("");
    const [Page, SetPage] = React.useState(1);
    const [SelectedRarity, SetSelectedRarity] = React.useState<SkinsType.SkinsRarity | null>(null);
    const [SelectedSkin, SetSelectedSkin] = React.useState<SkinsType.SkinsObject | null>(null);
    const [ModalClosing, SetModalClosing] = React.useState(false);

    const OpenModal = (Skin: SkinsType.SkinsObject) => {
        SetModalClosing(false);
        SetSelectedSkin(Skin);
    };

    const CloseModal = () => {
        if (!SelectedSkin || ModalClosing) return;

        SetModalClosing(true);

        window.setTimeout(() => {
            SetSelectedSkin(null);
            SetModalClosing(false);
        }, 130);
    };

    const {SetTopbarContent, SetFooterContent} = ReactRouter.useOutletContext<LayoutOutletContext>();

    React.useEffect(() => {
        SetPage(1);
    }, [Search, SelectedRarity]);

    const FilteredSkins = React.useMemo(() => {
        const Query = Search.trim().toLowerCase();
        return SkinsData.Skins.filter((Skin) => {
            const MatchesSearch = !Query || [Skin.name, Skin.internal_id, Skin.steam_id, Skin.discord_id ?? "", Skin.file_path].join(" ").toLowerCase().includes(Query);
            const MatchesRarity = SelectedRarity === null || Skin.type === SelectedRarity;
            return MatchesSearch && MatchesRarity;
        }).sort((A, B) => A.type - B.type);
    }, [Search, SelectedRarity]);

    const TotalPages = Math.max(1, Math.ceil(FilteredSkins.length / SKINS_PER_PAGE));
    const StartIndex = (Page - 1) * SKINS_PER_PAGE;
    const VisibleSkins = FilteredSkins.slice(StartIndex, StartIndex + SKINS_PER_PAGE);

    React.useEffect(() => {
        SetTopbarContent(
            <>
                <div className="group relative min-w-0 flex-1">
                    <Lucide.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-zinc-300"/>

                    <input type="text" value={Search} onChange={(Event) => SetSearch(Event.target.value)} placeholder="Search for a specific skin!" className="h-12 w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-zinc-700 hover:bg-zinc-900/90 focus:border-zinc-700"/>
                </div>

                <div className="w-full md:ml-auto md:w-auto">
                    <FilterDropdown SelectedRarity={SelectedRarity} SetSelectedRarity={SetSelectedRarity}/>
                </div>
            </>
        );

        return () => {
            SetTopbarContent(null);
        };
    }, [SetTopbarContent, Search, SelectedRarity]);

    React.useEffect(() => {
        SetFooterContent(
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center justify-center sm:w-auto sm:justify-start">
                    <div className="flex items-center gap-2 rounded-md border border-zinc-800/75 bg-zinc-950/50 px-3 py-2 text-sm whitespace-nowrap">
                        <span className="text-white/40">Showing</span>

                        <span className="font-mono font-semibold text-white">
                            {StartIndex}
                        </span>

                        <span className="text-white/30">-</span>

                        <span className="font-mono font-semibold text-white">
                            {Math.min(StartIndex + SKINS_PER_PAGE, FilteredSkins.length)}
                        </span>

                        <span className="text-white/30">of</span>

                        <span className="font-mono font-semibold text-white">
                            {FilteredSkins.length}
                        </span>

                        <span className="text-white/40">results</span>
                    </div>
                </div>

                <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
                    <button type="button" disabled={Page <= 1} onClick={() => SetPage((Value) => Math.max(1, Value - 1))} className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900 disabled:hover:text-white/70" title="Previous Page">
                        <Lucide.ChevronLeft className="h-4 w-4"/>
                    </button>

                    <div className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 text-sm">
                        <span className="font-medium text-white/40">Page</span>
                        <span className="font-mono font-semibold text-white">{Page}</span>
                        <span className="text-white/25">/</span>
                        <span className="font-mono text-white/60">{TotalPages}</span>
                    </div>

                    <button type="button" disabled={Page >= TotalPages} onClick={() => SetPage((Value) => Math.min(TotalPages, Value + 1))} className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900 disabled:hover:text-white/70" title="Next Page">
                        <Lucide.ChevronRight className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        );

        return () => {
            SetFooterContent(null);
        };
    }, [SetFooterContent, FilteredSkins.length, StartIndex, Page, TotalPages]);

    return (
        <>
        <main className="h-full min-h-0 w-full overflow-y-auto text-white custom-scrollbar xl:overflow-hidden">
            {VisibleSkins.length > 0 ? (
                <div className="grid min-h-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 xl:h-full xl:min-h-0 xl:grid-cols-4 xl:grid-rows-3">
                    {VisibleSkins.map((Skin) => (
                        <SkinCard key={`${Skin.internal_id}-${Skin.file_path}`} Skin={Skin} OnClick={() => OpenModal(Skin)}/>
                    ))}
                </div>
            ) : (
                <div className="relative flex h-full min-h-64 flex-col items-center justify-center text-center">
    
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_38%)]" />
                    <div className="absolute left-1/2 top-1/2 z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

                    <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
                        <h1 className="bg-linear-to-b from-indigo-300 to-indigo-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
                            Uh oh!
                        </h1>

                        <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
                            Seems like there is no data for this filter. Try a different filter or remove the filter entirely to see skins.
                        </p>
                    </section>
                </div>
            )}
        </main>

        {SelectedSkin && (
            <SkinModal Skin={SelectedSkin} Closing={ModalClosing} OnClose={CloseModal}/>
        )}
    </>
    );
};