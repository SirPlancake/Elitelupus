import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group";
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {useSearchParams, useNavigate} from "react-router-dom";
import {ChevronLeft, ChevronRight, RefreshCw, Search as SearchIcon, X} from "lucide-react";
import {FaDiscord, FaSteam} from "react-icons/fa";
import {useCallback, useEffect, useMemo, useState} from "react";
import {type SkinObject, SkinTypes, SkinOrders, SkinColors} from "@/types/Skin.ts";
import {useLayoutTopbar} from "@/components/custom/LayoutTopbar.tsx";
import Config from "../../vite.app.config.js";

type SkinFilterValue = "all" | "new" | `${number}`;

type SkinFilterOption = {
    label: string;
    value: SkinFilterValue;
};

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

const NormalizeUnixTimestamp = (Timestamp: number) => {
    return Timestamp < 1_000_000_000_000 ? Timestamp * 1000 : Timestamp;
};

const IsSkinNew = (Skin: SkinObject) => {
    if (!Skin.created_at) return false;

    return NormalizeUnixTimestamp(Skin.created_at) >= Date.now() - TwoWeeksInMilliseconds;
};

const SkinFilterOptions: SkinFilterOption[] = [
    {label: "All Skins", value: "all"},
    {label: "New", value: "new"},
    ...Object.entries(SkinTypes).map(([Value, Label]) => ({
        label: Label,
        value: Value as SkinFilterValue,
    })),
];

const DefaultSkinFilter = SkinFilterOptions[0];

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Search, setSearch] = useState(SearchParams.get("search") || "");
    const [SkinFilter, setSkinFilter] = useState<SkinFilterValue>((SearchParams.get("filter") as SkinFilterValue | null) || DefaultSkinFilter.value);
    const [Page, setPage] = useState(1);
    const Navigate = useNavigate();

    useEffect(() => {
        let RetryTimer: ReturnType<typeof setTimeout>;

        const FetchData = async () => {
            try {
                const [SkinsResponse] = await Promise.all([
                    fetch(`${Config.API_URL}/skins`)
                ]);

                const [SkinsJson] = await Promise.all([
                    SkinsResponse.json(),
                ]);

                const SkinsData = (SkinsJson.data || [])
                .map((Item: SkinObject) => ({
                    id: Item.id,
                    name: Item.name,
                    internal_id: Item.internal_id,
                    steam_id: Item.steam_id,
                    discord_id: Item.discord_id,
                    image_url: Item.image_url,
                    created_at: Item.created_at,
                    type: Item.type,
                })).sort((A: SkinObject, B: SkinObject) => SkinOrders[A.type] - SkinOrders[B.type]);

                setSkins(SkinsData);
                setLoading(false);
            } catch {
                setLoading(true);
                RetryTimer = setTimeout(FetchData, 5000);
            };
        };

        FetchData();

        return () => {
            if (RetryTimer) clearTimeout(RetryTimer);
        };
    }, []);

    const UpdateSearchParameters = useCallback((NextSearch: string, NextFilter: SkinFilterValue) => {
        const Parameters = new URLSearchParams();

        if (NextSearch) {
            Parameters.set("search", NextSearch);
        };

        if (NextFilter !== DefaultSkinFilter.value) {
            Parameters.set("filter", NextFilter);
        };

        setSearchParams(Parameters);
    }, [setSearchParams]);

    const SelectedSkinFilter = SkinFilterOptions.find((Option) => Option.value === SkinFilter) || DefaultSkinFilter;

    const FilteredSkins = useMemo(() => {
        const Query = Search.toLowerCase();

        return Skins
        .filter((Skin) => {
            if (SkinFilter === "new") return IsSkinNew(Skin);
            if (SkinFilter !== "all") return Skin.type === Number(SkinFilter);
            return true;
        })
        .filter((Skin) => {
            if (!Search) return true;

            const Searchable = [
                Skin.name,
                Skin.internal_id,
                Skin.steam_id,
                Skin.discord_id,
                SkinTypes[Skin.type],
                IsSkinNew(Skin) ? "new" : "",
            ].filter(Boolean).join(" ").toLowerCase();

            return Searchable.includes(Query);
        })
        .sort((A, B) => {
            if (SkinFilter !== "new") return 0;

            return NormalizeUnixTimestamp(B.created_at || 0) - NormalizeUnixTimestamp(A.created_at || 0);
        });
    }, [Search, SkinFilter, Skins]);

    const ItemsPerPage = 12;
    const TotalPages = Math.max(1, Math.ceil(FilteredSkins.length / ItemsPerPage));
    const DisplaySkins = FilteredSkins.slice((Page - 1) * ItemsPerPage, Page * ItemsPerPage);

    useEffect(() => {
        const SearchParameter = SearchParams.get("search") || "";
        const FilterParameter = (SearchParams.get("filter") as SkinFilterValue | null) || DefaultSkinFilter.value;

        setSearch(SearchParameter);
        setSkinFilter(SkinFilterOptions.some((Option) => Option.value === FilterParameter) ? FilterParameter : DefaultSkinFilter.value);
    }, [SearchParams]);

    useEffect(() => {
        if (Page > TotalPages) setPage(TotalPages);
    }, [TotalPages]);

    const TopbarContent = useMemo(() => {
        if (Loading) return null;

        return (
            <>
                <div className="relative z-35 ml-1 w-full sm:w-90">
                    <InputGroup className={"h-10.5 rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}>
                        <InputGroupInput value={Search} onChange={(Interaction) => {const Value = Interaction.target.value; setSearch(Value); setPage(1); UpdateSearchParameters(Value, SkinFilter)}} placeholder="Looking for a skin? Search here."/>
                        <InputGroupAddon>
                            <InputGroupText>
                                <SearchIcon className="h-4 w-4 text-zinc-400" />
                            </InputGroupText>
                        </InputGroupAddon>

                        <InputGroupAddon align="inline-end">
                            <InputGroupText className="text-zinc-400 text-xs">
                                {FilteredSkins.length} Result(s)
                            </InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                </div>

                <div className="relative z-35 w-full sm:w-54">
                    <Combobox items={SkinFilterOptions} value={SelectedSkinFilter.label} onValueChange={(Value) => {
                        if (typeof Value !== "string") return;

                        const NextFilter = SkinFilterOptions.find((Option) => Option.label === Value)?.value || DefaultSkinFilter.value;

                        setSkinFilter(NextFilter);
                        setPage(1);
                        UpdateSearchParameters(Search, NextFilter);
                    }}>
                        <ComboboxInput placeholder="Filter skins" className={"h-full rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}/>
                        <ComboboxContent className="my-2 bg-zinc-900 border border-zinc-700 rounded-sm z-50 text-gray-200">
                            <ComboboxEmpty>No filters found.</ComboboxEmpty>
                            <ComboboxList>
                                {(Item: SkinFilterOption) => (
                                    <>
                                    <ComboboxItem
                                        key={Item.value}
                                        value={Item.label}
                                        className="cursor-pointer w-full text-left px-3 py-2 text-white hover:bg-zinc-800 data-selected:bg-zinc-800 data-highlighted:bg-zinc-800 rounded-sm data-highlighted:text-gray-300"
                                    >
                                        {Item.label}
                                    </ComboboxItem>

                                    {Item.value === "all" && (
                                        <div className="my-1 h-px bg-zinc-700/75" />
                                    )}
                                    </>
                                )}
                                </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
            </>
        );
    }, [FilteredSkins.length, Loading, Search, SelectedSkinFilter.label, SkinFilter, UpdateSearchParameters]);

    useLayoutTopbar(TopbarContent);

    return (
        <>
            {Loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <RefreshCw className="animate-spin h-24 w-24 text-zinc-300"/>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-3">
                        {DisplaySkins.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center rounded-md border border-zinc-800/75 bg-zinc-950/75 px-6 py-10 text-center text-sm text-zinc-400">
                                <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                                    <div className="absolute inset-1 rounded-full border-2 border-red-400 animate-pulse" />
                                    <X className="h-12 w-12 text-red-400 animate-pulse" />
                                </div>

                                <h3 className="text-base font-semibold text-zinc-100">
                                    No skins found
                                </h3>

                                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                                    We couldn&apos;t find any skins in this category. Try selecting another category or check back later.
                                </p>
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {DisplaySkins.map((Skin) => (
                                <div key={Skin.id} className="cursor-pointer flex flex-col border border-zinc-800/75 bg-zinc-950/75 rounded-md p-4 transition hover:border-zinc-700/75 hover:bg-zinc-900/50" onClick={() => {Navigate(`/viewer?skin=${Skin.name}`)}}>
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <img src={Skin.image_url} alt={Skin.name} className="h-23 w-2/4 rounded-md border border-zinc-700/75 bg-zinc-900/75 object-cover shadow-inner"/>
                                        <div className="flex flex-col justify-center flex-1">
                                            <p className="font-medium text-xl text-gray-300 truncate">{Skin.name}</p>
                                            <p className={`font-medium ${SkinColors[Skin.type]}`}>{SkinTypes[Skin.type]}</p>
                                            <p className="text-gray-400">{Skin.internal_id}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <div className="flex flex-1 items-center border border-zinc-700 rounded-md overflow-hidden bg-zinc-800">
                                            <input type="text" readOnly value={Skin.steam_id} className="min-w-0 truncate flex-1 px-3 py-1 bg-transparent text-white text-sm focus:outline-none" onClick={(Interaction) => {Interaction.stopPropagation()}}/>
                                            <button className="shrink-0 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 transition text-white text-sm font-medium cursor-pointer" onClick={(Interaction) => {Interaction.stopPropagation(); navigator.clipboard.writeText(Skin.steam_id)}}>
                                                <FaSteam className="h-5 w-5"/>
                                            </button>
                                        </div>

                                        <div className="flex flex-1 items-center border border-zinc-700 rounded-md overflow-hidden bg-zinc-800">
                                            <input type="text" readOnly value={Skin.discord_id} className="min-w-0 truncate flex-1 px-3 py-1 bg-transparent text-white text-sm focus:outline-none" onClick={(Interaction) => {Interaction.stopPropagation()}}/>
                                            <button className="shrink-0 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 transition text-white text-sm font-medium cursor-pointer" onClick={(Interaction) => {Interaction.stopPropagation(); navigator.clipboard.writeText(Skin.discord_id)}}>
                                                <FaDiscord className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                        <div className="flex gap-2 justify-between">
                            <button disabled={Page <= 1} onClick={() => setPage(Page - 1)} className="cursor-pointer max-w-25 flex items-center justify-center flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <div className="flex flex-1 items-center justify-center font-medium text-white/70">
                                {`Page ${Page} of ${TotalPages}`}
                            </div>

                            <button disabled={Page >= TotalPages} onClick={() => setPage(Page + 1)} className="cursor-pointer max-w-25 flex items-center justify-center flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
