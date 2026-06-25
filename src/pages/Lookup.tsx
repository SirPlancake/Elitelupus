import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group";
import {useLayoutTopbar} from "@/components/custom/LayoutTopbar.tsx";
import {toast} from "sonner";
import {type ComponentType, type FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Ban, Clock, Copy, ExternalLink, Gamepad2, Info, RefreshCw, ScrollText, Search as SearchIcon, Shield, ShieldCheck, ShoppingBag, User, Users, X} from "lucide-react";
import {FaSteam} from "react-icons/fa";
import Config from "../../vite.app.config.js";

type SteamLookupIdentifiers = {
    steamid64: string;
    steamid3: string;
    steamid2: string;
    account_id: string;
    fivem_hex: string;
    profile_url: string;
    vanity_id: string | null;
};

type SteamLookupProfile = {
    name: string;
    avatar: string;
    avatar_medium: string;
    avatar_full: string;
    profile_state: number | null;
    persona_state: number | null;
    created_at: number | null;
    location: string;
    last_online: number | null;
    community_visible: string;
};

type SteamLookupSourceBan = {
    steamid: string;
    name: string | null;
    current_state: string;
    ban_reason: string | null;
    unban_reason: string | null;
    ban_timestamp: number;
    unban_timestamp: number;
    server: string | null;
};

type SteamLookupBans = {
    community_ban: boolean;
    vac_banned: boolean;
    vac_bans: number;
    last_ban: number;
    game_bans: number;
    trade_ban: string;
    sourcebans?: SteamLookupSourceBan[];
};

type SteamLookupData = {
    identifiers: SteamLookupIdentifiers;
    profile: SteamLookupProfile;
    bans: SteamLookupBans;
};

type SteamLookupResponse = {
    status: number;
    message: string;
    data?: SteamLookupData;
};

type DetailItem = {
    label: string;
    value: string | number | null | undefined;
    copy?: boolean;
};

type BanItem = {
    label: string;
    value: string | number;
    isDanger: boolean;
    Icon: ComponentType<{className?: string}>;
};

const PersonaStates: Record<number, string> = {
    0: "Offline",
    1: "Online",
    2: "Busy",
    3: "Away",
    4: "Snooze",
    5: "Looking to trade",
    6: "Looking to play",
};

const NormalizeUnixTimestamp = (Timestamp: number) => {
    return Timestamp < 1_000_000_000_000 ? Timestamp * 1000 : Timestamp;
};

const FormatUnixTimestamp = (Timestamp: number | null) => {
    if (!Timestamp) return "Unknown";

    const DateValue = new Date(NormalizeUnixTimestamp(Timestamp));
    if (Number.isNaN(DateValue.getTime())) return "Unknown";

    return DateValue.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const FormatPersonaState = (State: number | null) => {
    if (State === null || State === undefined) return "Unknown";

    return PersonaStates[State] || `State ${State}`;
};

const FormatProfileState = (State: number | null) => {
    if (State === null || State === undefined) return "Unknown";

    return State === 1 ? "Configured" : "Not configured";
};

const FormatTradeBan = (TradeBan: string | null | undefined) => {
    const State = String(TradeBan || "").trim().toLowerCase();

    if (!State || State === "none") return "Clear";
    if (State === "probation") return "Probation";
    if (State === "banned") return "Banned";

    return State
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((Part) => Part.charAt(0).toUpperCase() + Part.slice(1))
        .join(" ") || "Unknown";
};

const IsTradeBanDanger = (TradeBan: string | null | undefined) => {
    const State = String(TradeBan || "").trim().toLowerCase();

    return Boolean(State && State !== "none");
};

const FormatOptionalUnixTimestamp = (Timestamp: number | null | undefined) => {
    return Timestamp ? FormatUnixTimestamp(Timestamp) : "N/A";
};

const DecodeSourceBanText = (Value: string | null | undefined) => {
    if (!Value) return "Unknown";

    return Value.replace(/&(lt|gt|amp|quot|#39);/g, (Match) => ({
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": "\"",
        "&#39;": "'",
    })[Match] || Match);
};

const SourceBanStateClass = (State: string) => {
    switch (State.toLowerCase()) {
        case "permanent":
            return "border-red-500/30 bg-red-500/10 text-red-300";
        case "temp-ban":
            return "border-amber-500/30 bg-amber-500/10 text-amber-300";
        case "unbanned":
            return "border-lime-500/30 bg-lime-500/10 text-lime-300";
        case "expired":
            return "border-zinc-600 bg-zinc-800 text-zinc-300";
        default:
            return "border-zinc-700 bg-zinc-900 text-zinc-400";
    }
};

const CopyValue = async (Value: string | number | null | undefined) => {
    if (Value === null || Value === undefined || Value === "") return;

    await navigator.clipboard.writeText(String(Value));
    toast.success("Copied to clipboard.");
};

function ProfileAvatar({src, alt, compact: IsCompact}: {src: string; alt: string; compact?: boolean}) {
    const [Loaded, setLoaded] = useState(false);
    const [Failed, setFailed] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setFailed(false);
    }, [src]);

    return (
        <div className={`relative shrink-0 overflow-hidden rounded-md border border-zinc-700/75 bg-zinc-900 shadow-inner ${IsCompact ? "h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20" : "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"}`}>
            {!Loaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70">
                    <RefreshCw className="h-8 w-8 animate-spin text-zinc-300"/>
                </div>
            )}

            {Failed && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70">
                    <User className="h-10 w-10 text-zinc-500"/>
                </div>
            )}

            <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => {setLoaded(true); setFailed(true)}} className={`h-full w-full object-cover transition-opacity duration-200 ${Loaded && !Failed ? "opacity-100" : "opacity-0"}`}/>
        </div>
    );
}

function DetailRow({label: Label, value: Value, copy: IsCopyable}: DetailItem) {
    const DisplayValue = Value === null || Value === undefined || Value === "" ? "Unknown" : String(Value);

    return (
        <div className="flex min-w-0 items-center gap-2 border-b border-zinc-800/75 py-2 last:border-b-0">
            <span className="w-29 shrink-0 text-xs font-medium text-zinc-500 sm:w-34">{Label}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300 sm:text-sm">{DisplayValue}</span>

            {IsCopyable && (
                <button aria-label={`Copy ${Label}`} title={`Copy ${Label}`} onClick={() => CopyValue(DisplayValue)} className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200">
                    <Copy className="h-3.5 w-3.5"/>
                </button>
            )}
        </div>
    );
}

function StatusBlock({label: Label, value: Value, isDanger: IsDanger, Icon, compact: IsCompact}: BanItem & {compact?: boolean}) {
    return (
        <div className={`flex rounded-md border border-zinc-800/75 bg-zinc-900/55 ${IsCompact ? "min-h-18 p-3" : "min-h-24 p-4"}`}>
            <div className={`flex min-w-0 flex-1 items-center ${IsCompact ? "gap-3" : "gap-4 xl:px-8"}`}>
                <div className={`flex shrink-0 items-center justify-center rounded-md border ${IsCompact ? "h-11 w-11 sm:h-12 sm:w-12" : "h-14 w-14 sm:h-16 sm:w-16"} ${IsDanger ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-lime-500/25 bg-lime-500/10 text-lime-300"}`}>
                    <Icon className={IsCompact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-7 w-7 sm:h-8 sm:w-8"}/>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="min-w-0 truncate text-sm font-medium text-zinc-400">{Label}</p>
                    <p className={`mt-1 truncate font-semibold leading-none ${IsCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} ${IsDanger ? "text-red-300" : "text-lime-300"}`}>{Value}</p>
                </div>
            </div>
        </div>
    );
}

function SourceBanStateBadge({state: State}: {state: string}) {
    return (
        <span className={`inline-flex h-6 items-center rounded-sm border px-2 text-xs font-medium ${SourceBanStateClass(State)}`}>
            {State || "Unknown"}
        </span>
    );
}

function ModalDetail({label: Label, value: Value}: {label: string; value: string | number | null | undefined}) {
    const DisplayValue = Value === null || Value === undefined || Value === "" ? "Unknown" : String(Value);

    return (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/75 p-3">
            <p className="text-xs font-medium text-zinc-500">{Label}</p>
            <p className="mt-1 wrap-break-word text-sm leading-6 text-zinc-300">{DisplayValue}</p>
        </div>
    );
}

function GameBanInfoModal({ban: SourceBan, onClose: OnClose}: {ban: SteamLookupSourceBan; onClose: () => void}) {
    const Name = DecodeSourceBanText(SourceBan.name);
    const Server = DecodeSourceBanText(SourceBan.server);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" role="dialog" aria-modal="true" aria-labelledby="game-ban-info-title" onMouseDown={OnClose}>
            <div className="theme-scrollbar max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 shadow-2xl" onMouseDown={(Interaction) => Interaction.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950 p-4">
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <SourceBanStateBadge state={SourceBan.current_state}/>
                            <span className="rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-400">{Server}</span>
                        </div>

                        <h2 id="game-ban-info-title" className="truncate text-base font-semibold text-zinc-100">{Name}</h2>
                        <p className="mt-1 font-mono text-xs text-zinc-500">{SourceBan.steamid}</p>
                    </div>

                    <button type="button" aria-label="Close game ban information" title="Close" onClick={OnClose} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200">
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <div className="grid gap-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ModalDetail label="Name" value={Name}/>
                        <ModalDetail label="Server" value={Server}/>
                        <ModalDetail label="Current State" value={SourceBan.current_state}/>
                        <ModalDetail label="SteamID" value={SourceBan.steamid}/>
                        <ModalDetail label="Banned" value={FormatOptionalUnixTimestamp(SourceBan.ban_timestamp)}/>
                        <ModalDetail label="Unbanned" value={FormatOptionalUnixTimestamp(SourceBan.unban_timestamp)}/>
                    </div>

                    <ModalDetail label="Ban Reason" value={DecodeSourceBanText(SourceBan.ban_reason)}/>
                    <ModalDetail label="Unban Reason" value={DecodeSourceBanText(SourceBan.unban_reason)}/>
                </div>
            </div>
        </div>
    );
}

function EmptyLookup() {
    return (
        <div className="flex h-full flex-col items-center justify-center rounded-md border border-zinc-800/75 bg-zinc-950/75 px-6 py-10 text-center text-sm text-zinc-400">
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-1 rounded-full border-2 border-red-400 animate-pulse" />
                <SearchIcon className="h-12 w-12 text-red-400 animate-pulse" />
            </div>

            <h3 className="text-base font-semibold text-zinc-100">
                No user selected
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                Looks like you've not searched for anyone yet. Input a steam user using the search bar above. 
            </p>
        </div>
    );
}

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const SearchParameter = SearchParams.get("input") || "";
    const [Search, setSearch] = useState(SearchParameter);
    const [RefreshIndex, setRefreshIndex] = useState(0);
    const [Loading, setLoading] = useState(Boolean(SearchParameter));
    const [LookupError, setLookupError] = useState<string | null>(null);
    const [LookupData, setLookupData] = useState<SteamLookupData | null>(null);
    const [SelectedGameBan, setSelectedGameBan] = useState<SteamLookupSourceBan | null>(null);

    useEffect(() => {
        setSearch(SearchParameter);
    }, [SearchParameter]);

    useEffect(() => {
        setSelectedGameBan(null);
    }, [SearchParameter]);

    useEffect(() => {
        if (!SelectedGameBan) return;

        const HandleKeyDown = (Interaction: KeyboardEvent) => {
            if (Interaction.key === "Escape") {
                setSelectedGameBan(null);
            }
        };

        window.addEventListener("keydown", HandleKeyDown);

        return () => {
            window.removeEventListener("keydown", HandleKeyDown);
        };
    }, [SelectedGameBan]);

    useEffect(() => {
        const Input = SearchParameter.trim();

        if (!Input) {
            setLoading(false);
            setLookupError(null);
            setLookupData(null);
            return;
        };

        const Controller = new AbortController();

        const FetchData = async () => {
            try {
                setLoading(true);
                setLookupError(null);

                const Response = await fetch(`${Config.API_URL}/lookup?input=${encodeURIComponent(Input)}`, {
                    signal: Controller.signal,
                });

                const Json = await Response.json().catch(() => null) as SteamLookupResponse | null;

                if (!Response.ok) {
                    throw new Error(Json?.message || `Request failed with status ${Response.status}`);
                };

                if (!Json?.data) {
                    throw new Error(Json?.message || "No Steam data was returned.");
                };

                setLookupData(Json.data);
                setLoading(false);
            } catch (Error) {
                if (Controller.signal.aborted) return;

                setLookupData(null);
                setLookupError(Error instanceof globalThis.Error ? Error.message : "Unable to lookup that Steam user.");
                setLoading(false);
            };
        };

        FetchData();

        return () => {
            Controller.abort();
        };
    }, [RefreshIndex, SearchParameter]);

    const HandleSubmit = useCallback((Interaction: FormEvent<HTMLFormElement>) => {
        Interaction.preventDefault();

        const Input = Search.trim();
        const Parameters = new URLSearchParams();

        if (!Input) {
            setSearchParams(Parameters);
            return;
        };

        Parameters.set("input", Input);

        if (Input === SearchParameter) {
            setRefreshIndex((Index) => Index + 1);
        } else {
            setSearchParams(Parameters);
        };
    }, [Search, SearchParameter, setSearchParams]);

    const HandleClear = useCallback(() => {
        setSearch("");
        setSearchParams(new URLSearchParams());
    }, [setSearchParams]);

    const IdentifierItems = useMemo<DetailItem[]>(() => {
        if (!LookupData) return [];

        return [
            {label: "SteamID64", value: LookupData.identifiers.steamid64, copy: true},
            {label: "SteamID3", value: LookupData.identifiers.steamid3, copy: true},
            {label: "SteamID2", value: LookupData.identifiers.steamid2, copy: true},
            {label: "Account ID", value: LookupData.identifiers.account_id, copy: true},
            {label: "FiveM Hex", value: LookupData.identifiers.fivem_hex, copy: true},
            {label: "Vanity", value: LookupData.identifiers.vanity_id, copy: true},
        ];
    }, [LookupData]);

    const ProfileItems = useMemo<DetailItem[]>(() => {
        if (!LookupData) return [];

        return [
            {label: "Visibility", value: LookupData.profile.community_visible, copy: true},
            {label: "Persona", value: FormatPersonaState(LookupData.profile.persona_state), copy: true},
            {label: "Profile", value: FormatProfileState(LookupData.profile.profile_state), copy: true},
            {label: "Created", value: FormatUnixTimestamp(LookupData.profile.created_at), copy: true},
            {label: "Last Online", value: FormatUnixTimestamp(LookupData.profile.last_online), copy: true},
            {label: "Location", value: LookupData.profile.location, copy: true},
        ];
    }, [LookupData]);

    const BanItems = useMemo<BanItem[]>(() => {
        if (!LookupData) return [];

        const Bans = LookupData.bans;

        return [
            {label: "Community", value: Bans.community_ban ? "Banned" : "Clear", isDanger: Bans.community_ban, Icon: Users},
            {label: "VAC", value: Bans.vac_banned ? "Banned" : "Clear", isDanger: Bans.vac_banned, Icon: Shield},
            {label: "VAC Bans", value: Bans.vac_bans, isDanger: Bans.vac_bans > 0, Icon: Ban},
            {label: "Game Bans", value: Bans.game_bans, isDanger: Bans.game_bans > 0, Icon: Gamepad2},
            {label: "Last Ban", value: Bans.vac_bans > 0 || Bans.game_bans > 0 ? `${Bans.last_ban} days` : "None", isDanger: Bans.vac_bans > 0 || Bans.game_bans > 0, Icon: Clock},
            {label: "Trade", value: FormatTradeBan(Bans.trade_ban), isDanger: IsTradeBanDanger(Bans.trade_ban), Icon: ShoppingBag},
        ];
    }, [LookupData]);

    const SourceBans = useMemo(() => LookupData?.bans.sourcebans || [], [LookupData]);
    const HasSourceBans = SourceBans.length > 0;
    const MissingSourceBanResults = Math.max((LookupData?.bans.game_bans || 0) - SourceBans.length, 0);
    const MissingSourceBanRows = useMemo(() => {
        if (MissingSourceBanResults <= 6) {
            return Array.from({length: MissingSourceBanResults}, (_, Index) => ({
                index: SourceBans.length + Index + 1,
                count: 1,
                isSummary: false,
            }));
        }

        return [{
            index: SourceBans.length + 1,
            count: MissingSourceBanResults,
            isSummary: true,
        }];
    }, [MissingSourceBanResults, SourceBans.length]);

    const TopbarContent = useMemo(() => (
        <form onSubmit={HandleSubmit} className="relative z-35 ml-1 flex w-full min-w-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 sm:max-w-110">
                <InputGroup className={"h-10.5 rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}>
                    <InputGroupInput value={Search} onChange={(Interaction) => setSearch(Interaction.target.value)} placeholder="Looking for a user? Search here."/>
                    <InputGroupAddon>
                        <InputGroupText>
                            <FaSteam className="h-4 w-4 text-zinc-400"/>
                        </InputGroupText>
                    </InputGroupAddon>

                    {Search && (
                        <InputGroupAddon align="inline-end">
                            <button type="button" aria-label="Clear lookup" title="Clear lookup" onClick={HandleClear} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200">
                                <X className="h-4 w-4"/>
                            </button>
                        </InputGroupAddon>
                    )}
                </InputGroup>
            </div>

            <button type="submit" aria-label="Lookup Steam user" title="Lookup Steam user" disabled={Loading || !Search.trim()} className="flex h-10.5 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-white transition hover:border-zinc-600 hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-40">
                {Loading ? <RefreshCw className="h-5 w-5 animate-spin"/> : <SearchIcon className="h-5 w-5"/>}
            </button>
        </form>
    ), [HandleClear, HandleSubmit, Loading, Search]);

    useLayoutTopbar(TopbarContent, false);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto p-3 xl:overflow-hidden">
                {Loading ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-zinc-800/75 bg-zinc-950/75 px-6 py-10 text-center">
                        <RefreshCw className="h-24 w-24 animate-spin text-zinc-300"/>
                        <p className="mt-6 text-base font-medium text-zinc-100">Loading Steam profile</p>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">{SearchParameter}</p>
                    </div>
                ) : LookupError ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-zinc-800/75 bg-zinc-950/75 px-6 py-10 text-center">
                        <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                            <div className="absolute inset-1 rounded-full border-2 border-red-400 animate-pulse"/>
                            <X className="h-12 w-12 text-red-400 animate-pulse"/>
                        </div>

                        <h3 className="text-base font-semibold text-zinc-100">Uh oh, something went wrong</h3>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{LookupError}</p>
                    </div>
                ) : LookupData ? (
                    <div className="grid min-h-full grid-cols-1 gap-3 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
                        <div className="flex min-w-0 flex-col gap-3 xl:min-h-0">
                                <div className={`rounded-md border border-zinc-800/75 bg-zinc-950/75 ${HasSourceBans ? "p-3" : "p-4"}`}>
                                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                        <ProfileAvatar src={LookupData.profile.avatar_full || LookupData.profile.avatar_medium || LookupData.profile.avatar} alt={LookupData.profile.name} compact={HasSourceBans}/>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <h1 className="min-w-0 truncate text-xl font-semibold text-zinc-100 sm:text-3xl">{LookupData.profile.name}</h1>
                                                <span className={`shrink-0 rounded-sm border px-2 py-1 text-xs font-medium ${LookupData.profile.community_visible === "Public" ? "border-lime-500/30 bg-lime-500/10 text-lime-300" : "border-zinc-700 bg-zinc-800 text-zinc-400"}`}>
                                                    {LookupData.profile.community_visible}
                                                </span>
                                            </div>

                                            <div className={`${HasSourceBans ? "mt-2" : "mt-3 sm:mt-2"} flex flex-wrap gap-2`}>
                                                <a href={LookupData.identifiers.profile_url} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 sm:h-8">
                                                    <ExternalLink className="h-4 w-4"/>
                                                    Steam Profile
                                                </a>

                                                <a href={`https://steamid.io/lookup/${LookupData.identifiers.steamid64}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 sm:h-8">
                                                    <ExternalLink className="h-4 w-4"/>
                                                    SteamID.IO
                                                </a>

                                                <a href={`https://steamdb.info/calculator/${LookupData.identifiers.steamid64}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 sm:h-8">
                                                    <ExternalLink className="h-4 w-4"/>
                                                    SteamDB.Info
                                                </a>

                                                <button onClick={() => CopyValue(LookupData.identifiers.profile_url)} className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 sm:h-8">
                                                    <Copy className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex flex-col rounded-md border border-zinc-800/75 bg-zinc-950/75 ${HasSourceBans ? "p-3" : "min-h-0 p-4 xl:flex-1"}`}>
                                    <div className={`${HasSourceBans ? "mb-2" : "mb-3"} flex items-center gap-2 text-sm font-semibold text-zinc-200`}>
                                        <ShieldCheck className="h-4 w-4 text-zinc-400"/>
                                        Ban Status
                                    </div>

                                    <div className={`grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 ${HasSourceBans ? "" : "flex-1"}`}>
                                        {BanItems.map((Item) => (
                                            <StatusBlock key={Item.label} {...Item} compact={HasSourceBans}/>
                                        ))}
                                    </div>
                                </div>

                                {HasSourceBans && (
                                    <div className="flex min-h-0 flex-1 flex-col rounded-md border border-zinc-800/75 bg-zinc-950/75 p-3">
                                        <div className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-200">
                                            <ScrollText className="h-4 w-4 text-zinc-400"/>
                                            Game Bans
                                        </div>

                                        <div className="theme-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                                            {SourceBans.map((SourceBan, Index) => {
                                                const Name = DecodeSourceBanText(SourceBan.name);
                                                const Server = DecodeSourceBanText(SourceBan.server);

                                                return (
                                                    <div key={`${SourceBan.steamid}-${SourceBan.server || "server"}-${SourceBan.ban_timestamp}-${Index}`} className="flex min-h-16 min-w-0 items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <SourceBanStateBadge state={SourceBan.current_state}/>
                                                                <p className="truncate text-xs font-semibold text-zinc-300" title={Name}>{Name}</p>
                                                            </div>

                                                            <p className="mt-1 truncate text-xs text-zinc-500" title={Server}>{Server}</p>
                                                        </div>

                                                        <button type="button" onClick={() => setSelectedGameBan(SourceBan)} className="flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700">
                                                            <Info className="h-3.5 w-3.5"/>
                                                            View Info
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {MissingSourceBanRows.map((MissingRow) => (
                                                <div key={`missing-game-ban-${MissingRow.index}`} className="flex min-h-16 items-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 px-3 py-2.5">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-zinc-300">
                                                            {MissingRow.isSummary ? `${MissingRow.count} game bans that had no data.` : "There was no data for this one"}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-zinc-500">
                                                            {MissingRow.isSummary ? `Game bans through #${MissingRow.index}-#${MissingRow.index + MissingRow.count - 1}` : `Game ban #${MissingRow.index}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 rounded-md border border-zinc-800/75 bg-zinc-950/75 p-4 xl:min-h-0">
                                <section className="min-w-0">
                                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                                        <FaSteam className="h-4 w-4 text-zinc-400"/>
                                        Identifiers
                                    </div>

                                    <div>
                                        {IdentifierItems.map((Item) => (
                                            <DetailRow key={Item.label} {...Item}/>
                                        ))}
                                    </div>
                                </section>

                                <section className="mt-3 min-w-0">
                                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                                        <User className="h-4 w-4 text-zinc-400"/>
                                        Profile
                                    </div>

                                    <div>
                                        {ProfileItems.map((Item) => (
                                            <DetailRow key={Item.label} {...Item}/>
                                        ))}
                                    </div>
                                </section>
                            </div>
                    </div>
                ) : (
                    <EmptyLookup/>
                )}
            </div>

            {SelectedGameBan && (
                <GameBanInfoModal ban={SelectedGameBan} onClose={() => setSelectedGameBan(null)}/>
            )}

            <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                <div className="h-10" />
            </div>
        </div>
    );
};
