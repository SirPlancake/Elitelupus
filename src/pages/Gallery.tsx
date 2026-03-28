import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group";
import {useSearchParams, useNavigate} from "react-router-dom";
import {ChevronLeft, ChevronRight, RefreshCw, Search as SearchIcon} from "lucide-react";
import {FaDiscord, FaSteam} from "react-icons/fa";
import {useEffect, useState} from "react";
import {type SkinObject, SkinTypes, SkinOrders} from "@/types/Skin.ts";
import Config from "../../vite.app.config.ts";

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Search, setSearch] = useState(SearchParams.get("search") || "");
    const [Page, setPage] = useState(1);
    const Navigate = useNavigate();

    useEffect(() => {
        let RetryTimer: ReturnType<typeof setTimeout>;

        const FetchData = async () => {
            try {
                const [SkinsResponse] = await Promise.all([
                    fetch(`${Config.API_URL}/gmod/skins`)
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
                        texture_url: Item.texture_url,
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

    const FilteredSkins = Skins.filter((Skin) => {
        if (!Search) return true;
        const Query = Search.toLowerCase();
        const Searchable = [
            Skin.name,
            Skin.internal_id,
            Skin.steam_id,
            Skin.discord_id,
            SkinTypes[Skin.type],
        ].filter(Boolean).join(" ").toLowerCase();
        return Searchable.includes(Query);
    });

    const ItemsPerPage = 12;
    const TotalPages = Math.ceil(FilteredSkins.length / ItemsPerPage);
    const DisplaySkins = FilteredSkins.slice((Page - 1) * ItemsPerPage, Page * ItemsPerPage);

    useEffect(() => {
        const SearchParameter = SearchParams.get("search") || "";
        setSearch(SearchParameter);
    }, [SearchParams]);

    useEffect(() => {
        if (Page > TotalPages) setPage(TotalPages || 1);
    }, [TotalPages]);

    return (
        <>
            <main className="flex-1 flex flex-col rounded-lg border border-zinc-800/75 bg-zinc-900/75 overflow-hidden">
                {Loading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <RefreshCw className="animate-spin h-24 w-24 text-zinc-300"/>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg h-20 flex items-center gap-3">
                            <div className="relative w-90 ml-1 z-35">
                            <InputGroup className={"h-10.5 rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}>
                                <InputGroupInput value={Search} onChange={(Interaction) => {const Value = Interaction.target.value; setSearch(Value); setPage(1); if (Value) {setSearchParams({search: Value})} else {setSearchParams({})}}} placeholder="Looking for a skin? Search here."/>
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
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {DisplaySkins.map((Skin) => (
                                    <div key={Skin.id} className="cursor-pointer flex flex-col border border-zinc-800/75 bg-zinc-950/75 rounded-md p-4 transition hover:border-zinc-700/75 hover:bg-zinc-900/50" onClick={() => {Navigate(`/viewer?skin=${Skin.name}`)}}>
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <img src={Skin.image_url} alt={Skin.name} className="h-23 w-2/4 rounded-md border border-zinc-700/75 bg-zinc-900/75 object-cover shadow-inner"/>
                                            <div className="flex flex-col justify-center flex-1">
                                                <p className="font-medium text-xl text-gray-300 truncate">{Skin.name}</p>
                                                <p className={`font-medium ${Skin.type === 2 ? "text-orange-500" : Skin.type === 1 ? "text-lime-500" : "text-gray-500"}`}>{SkinTypes[Skin.type]}</p>
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
                        </div>

                        <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                            <div className="flex gap-2 justify-between">
                                <button disabled={Page <= 1} onClick={() => setPage(Page - 1)} className="cursor-pointer max-w-25 flex items-center justify-center flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <div className="flex flex-1 items-center justify-center font-medium text-white/70">
                                    {`Page ${Page} of ${TotalPages}`}
                                </div>

                                <button disabled={Page === TotalPages} onClick={() => setPage(Page + 1)} className="cursor-pointer max-w-25 flex items-center justify-center flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-900 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </>
    );
};