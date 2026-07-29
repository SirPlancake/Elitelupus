import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as ReactIcons from "react-icons/fa";
import * as Lucide from "lucide-react";
import * as SkinsData from "@/data/SkinsData.ts";
import * as RarityData from "@/data/RarityData.ts";
import * as SkinsType from "@/types/SkinsType.tsx";
import * as SpinnerComponent from "@/components/SpinnerComponent.tsx";
import type {LayoutOutletContext} from "@/Layout.tsx";

const SKINS_PER_PAGE = 8;

function GetRarity(Type: SkinsType.SkinsRarity) {
    return RarityData.RarityStyles.find((Rarity) => Rarity.value === Type) ?? RarityData.RarityStyles[RarityData.RarityStyles.length - 1];
};

function CopyField({Label, Value}: {Label: string; Value: string | null}) {
    const [Copied, SetCopied] = React.useState(false);

    const CopyValue = Value ?? "";
    const HasValue = CopyValue !== "N/A" && CopyValue.trim() !== "";

    async function Copy() {
        if (!HasValue) return;

        try {
            await navigator.clipboard.writeText(CopyValue);
            SetCopied(true);

            window.setTimeout(() => {
                SetCopied(false);
            }, 1200);
        } catch {
            SetCopied(false);
        };
    };

    return (
        <div
            className={`flex h-12 w-full min-w-0 overflow-hidden rounded-md border ${HasValue ? "border-zinc-800 bg-zinc-950/55 text-zinc-300" : "border-dashed border-zinc-800/60 bg-zinc-950/30 text-zinc-600"}`}>
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-900 text-zinc-500">
                    {Label === "Steam" ? (
                        <ReactIcons.FaSteam className="h-4 w-4" />
                    ) : Label === "Discord" ? (
                        <ReactIcons.FaDiscord className="h-4 w-4" />
                    ) : Label === "Internal ID" ? (
                        <ReactIcons.FaIdBadge className="h-4 w-4" />
                    ) : Label === "Name" ? (
                        <ReactIcons.FaUser className="h-4 w-4" />
                    ) : null}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-black uppercase leading-none tracking-[0.16em] text-zinc-500">
                        {Label}
                    </div>

                    <div className="mt-1 truncate font-mono text-[11px] leading-none text-zinc-300">
                        {HasValue ? CopyValue : "Unavailable"}
                    </div>
                </div>
            </div>

            <button type="button" onClick={Copy} disabled={!HasValue} title={HasValue ? `Copy ${Label}` : `${Label} is unavailable`} className={`flex h-full w-12 shrink-0 items-center justify-center border-l transition ${HasValue ? "cursor-pointer border-zinc-800 bg-zinc-950/70 text-zinc-500 hover:bg-white/10 hover:text-white" : "cursor-not-allowed border-zinc-800/60 bg-zinc-950/40 text-zinc-700"}`}>
                {HasValue ? (Copied ? (
                    <Lucide.Check className="h-4 w-4 text-green-400"/>) : (<Lucide.Copy className="h-4 w-4"/>
                    )) : (<Lucide.Minus className="h-4 w-4"/>)
                }
            </button>
        </div>
    );
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
            <button type="button" onClick={() => SetOpen((Value) => !Value)} className={`inline-flex h-12 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900/90 md:w-52 ${Open ? "border-zinc-700 bg-zinc-950" : ""}`}>
                <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-zinc-800 bg-zinc-950/60 text-zinc-500">
                    <Lucide.Filter className="h-4 w-4"/>
                </div>

                <span className="min-w-0 flex-1 truncate px-1 text-left">
                    {Selected ? Selected.name : "None"}
                </span>

                <Lucide.ChevronDown className={`mr-3 h-4 w-4 shrink-0 text-zinc-500 transition ${Open ? "rotate-180 text-zinc-300" : ""}`}/>
            </button>

            {Open && (
                <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl md:w-60">
                    <div className="p-1.5">
                        <button type="button" onClick={() => {SetSelectedRarity(null); SetOpen(false)}}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold transition ${SelectedRarity === null ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
                            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full border border-zinc-500/60 bg-zinc-500/10"/>

                            <span className="min-w-0 flex-1 truncate">
                                None
                            </span>

                            {SelectedRarity === null && <Lucide.Check className="h-4 w-4 shrink-0 text-zinc-300"/>}
                        </button>

                        <div className="my-1.5 border-t border-zinc-800"/>

                        {RarityData.RarityStyles.map((Rarity) => (
                            <button key={Rarity.name} type="button" onClick={() => {SetSelectedRarity(Rarity.value); SetOpen(false)}} className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold transition ${SelectedRarity === Rarity.value ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${Rarity.class}`}/>

                                <span className="min-w-0 flex-1 truncate">
                                    {Rarity.name}
                                </span>

                                {SelectedRarity === Rarity.value && <Lucide.Check className="h-4 w-4 shrink-0 text-zinc-300"/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function SkinCard({Skin}: {Skin: SkinsType.SkinsObject}) {
    const Rarity = GetRarity(Skin.type);

    return (
        <article className="flex min-h-90 flex-col overflow-hidden rounded-lg border border-zinc-800/75 bg-zinc-900 p-2 shadow-md xl:h-full xl:min-h-0">
            <div className="relative aspect-square overflow-hidden rounded-md border-b border-zinc-800 bg-zinc-950">
                <SpinnerComponent.Image src={`/images/skins/${Skin.file_path}`} alt={Skin.name} className="h-full w-full object-cover"/>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-black/90 via-black/45 to-transparent"/>

                <div className="absolute inset-x-2.5 top-2.5 p-1 z-20 flex items-center justify-between">
                    <span className={`inline-flex h-6 items-center rounded-sm border px-2 text-[9px] font-black uppercase tracking-[0.14em] ${Rarity.class}`}>
                        {Rarity.name}
                    </span>

                    <div className="flex items-center gap-2">
                        <ReactRouter.Link to={`/model-viewer?skin=${encodeURIComponent(Skin.name)}`} title="Open Model Viewer" className="flex h-6 w-6 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800/40 text-zinc-300 transition-colors hover:bg-zinc-700/60 hover:text-white">
                            <Lucide.ExternalLink className="h-3.5 w-3.5" />
                        </ReactRouter.Link>

                        <span className="inline-flex h-6 items-center rounded-sm border border-zinc-700 bg-zinc-800/40 px-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-300">
                            {Skin.created_at !== null ? new Date(Skin.created_at * 1000).toLocaleString() : "No Date"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="shrink-0 pt-2">
                <div className="mt-2 grid gap-2">
                    <CopyField Label="Name" Value={Skin.name}/>
                    <CopyField Label="Internal ID" Value={Skin.internal_id}/>
                    <CopyField Label="Steam" Value={Skin.steam_id}/>
                    <CopyField Label="Discord" Value={Skin.discord_id}/>
                </div>
            </div>
        </article>
    );
};

export default function Page() {
    const [Search, SetSearch] = React.useState("");
    const [Page, SetPage] = React.useState(1);
    const [SelectedRarity, SetSelectedRarity] = React.useState<SkinsType.SkinsRarity | null>(null);

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
                <div className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-sm text-gray-400 sm:w-auto sm:justify-start sm:pl-2">
                    <span className="text-zinc-400">Showing</span>

                    <span className="font-mono text-gray-300">
                        {StartIndex}
                    </span>

                    <span className="text-zinc-600">-</span>

                    <span className="font-mono text-gray-300">
                        {Math.min(StartIndex + SKINS_PER_PAGE, FilteredSkins.length)}
                    </span>

                    <span className="text-zinc-400">of</span>

                    <span className="font-mono text-gray-300">
                        {FilteredSkins.length}
                    </span>

                    <span className="text-zinc-400">results.</span>
                </div>

                <div className="flex h-10 w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 sm:w-auto">
                    <button type="button" disabled={Page <= 1} onClick={() => SetPage((Value) => Math.max(1, Value - 1))} className="grid h-10 flex-1 cursor-pointer place-items-center border-r border-zinc-800 bg-zinc-950/60 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-transparent sm:w-10 sm:flex-none" title="Previous Page">
                        <Lucide.ChevronLeft className="h-5 w-5 translate-x-px"/>
                    </button>

                    <div className="flex h-10 min-w-24 items-center justify-center border-r border-zinc-800 px-3 text-xs font-semibold text-white/80">
                        {Page} / {TotalPages}
                    </div>

                    <button type="button" disabled={Page >= TotalPages} onClick={() => SetPage((Value) => Math.min(TotalPages, Value + 1))} className="grid h-10 flex-1 cursor-pointer place-items-center bg-zinc-950/60 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-transparent sm:w-10 sm:flex-none" title="Next Page">
                        <Lucide.ChevronRight className="h-5 w-5 -translate-x-px"/>
                    </button>
                </div>
            </div>
        );

        return () => {
            SetFooterContent(null);
        };
    }, [SetFooterContent, FilteredSkins.length, StartIndex, Page, TotalPages]);

    return (
        <main className="h-full min-h-0 w-full overflow-y-auto text-white custom-scrollbar xl:overflow-hidden">
            {VisibleSkins.length > 0 ? (
                <div className="grid min-h-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 xl:h-full xl:min-h-0 xl:grid-cols-4 xl:grid-rows-2">
                    {VisibleSkins.map((Skin) => (
                        <SkinCard key={`${Skin.internal_id}-${Skin.file_path}`} Skin={Skin}/>
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
    );
};