import {type ComponentType, useEffect, useMemo, useState} from "react";
import {RefreshCw, Server as ServerIcon, TriangleAlert, UserCheck, Users} from "lucide-react";
import {Link} from "react-router-dom";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useLayoutTopbar} from "@/components/custom/LayoutTopbar.tsx";
import Config from "../../vite.app.config.js";

type TeamPlayer = {
    name: string;
    score: number;
    deaths?: number | null;
    duration: number | null;
    duration_formatted: string | null;
    server: {
        name: string;
        host: string;
        port: number;
    };
};

type TeamServer = {
    name: string;
    server_name?: string;
    host: string;
    port: number;
    current_players?: number;
    max_players?: number;
    error?: string;
    players?: TeamPlayer[];
};

type TeamMember = {
    rank: string | null;
    timezone: string | null;
    current_time: string | null;
    username: string | null;
    discord_id: string | null;
    is_online: boolean;
    online: {
        server: {
            name: string;
            host: string;
            port: number;
        };
        name: string;
        score: number;
        duration: number | null;
        duration_formatted: string | null;
    } | null;
    steam: {
        steamid32: string | null;
        steamid64: string | null;
        avatar?: string;
        avatarmedium?: string;
        avatarfull?: string;
        personaname?: string;
        profileurl?: string;
        created_at?: number | null;
    };
};

type TeamData = {
    staff: TeamMember[];
    servers: TeamServer[];
    updated_at: string | null;
};

type TeamResponse = {
    status: number;
    message: string;
    last_updated: string | null;
    data?: TeamData | [];
};

type StatItem = {
    label: string;
    value: string;
    detail: string;
    Icon: ComponentType<{className?: string}>;
};

type PublicPlayer = TeamPlayer & {
    key: string;
    server_name: string;
    staff?: TeamMember;
};

const EmptyTeamData: TeamData = {
    staff: [],
    servers: [],
    updated_at: null,
};

const RefreshSecond = 5;
const SortCollator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"});
const RankPriority = new Map([
    ["t staff", 0],
    ["t-staff", 0],
    ["trial staff", 0],
    ["operator", 1],
    ["snr operator", 2],
    ["senior operator", 2],
    ["moderator", 3],
    ["snr moderator", 4],
    ["senior moderator", 4],
    ["admin", 5],
    ["snr admin", 6],
    ["senior admin", 6],
    ["meta manager", 7],
    ["assistant sm", 8],
    ["staff manager", 9],
    ["manager", 10],
]);

const IsTeamData = (Data: TeamResponse["data"]): Data is TeamData => {
    return Boolean(Data && !Array.isArray(Data) && "staff" in Data && "servers" in Data);
};

const FormatDuration = (Milliseconds: number) => {
    const TotalSeconds = Math.max(0, Math.floor(Milliseconds / 1000));
    const Hours = Math.floor(TotalSeconds / 3600);
    const Minutes = Math.floor((TotalSeconds % 3600) / 60);
    const Seconds = TotalSeconds % 60;

    if (Hours > 0) {
        return `${Hours}h ${Minutes.toString().padStart(2, "0")}m`;
    };

    if (Minutes > 0) {
        return `${Minutes}m ${Seconds.toString().padStart(2, "0")}s`;
    };

    return `${Seconds}s`;
};

const FormatUpdatedAgo = (Value: string | null, CurrentTime: number) => {
    if (!Value) return "waiting";

    const DateValue = new Date(Value);
    if (Number.isNaN(DateValue.getTime())) return "unknown";

    return `${FormatDuration(CurrentTime - DateValue.getTime())} ago`;
};

const GetNextRefreshAt = (CurrentTime = Date.now()) => {
    const NextRefresh = new Date(CurrentTime);

    NextRefresh.setMilliseconds(0);

    if (NextRefresh.getSeconds() < RefreshSecond) {
        NextRefresh.setSeconds(RefreshSecond);
    } else {
        NextRefresh.setMinutes(NextRefresh.getMinutes() + 1, RefreshSecond, 0);
    };

    return NextRefresh.getTime();
};

const FormatPlayerDuration = (Player: TeamPlayer) => {
    if (Player.duration_formatted) return Player.duration_formatted;
    if (Player.duration === null || Player.duration === undefined) return "-";

    return FormatDuration(Player.duration * 1000);
};

const FormatPlayerScore = (Player: TeamPlayer) => {
    return String(Player.score ?? 0);
};

const GetServerName = (Server: TeamServer) => {
    return Server.server_name || Server.name || `${Server.host}:${Server.port}`;
};

const GetSteamID = (Member: TeamMember) => {
    return Member.steam.steamid64 || Member.steam.steamid32 || "-";
};

const NormalizeRank = (Rank: string | null) => {
    return (Rank || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
};

const GetRankPriority = (Rank: string | null) => {
    return RankPriority.get(NormalizeRank(Rank));
};

const CompareRankValues = (FirstRank: string | null, SecondRank: string | null) => {
    const FirstPriority = GetRankPriority(FirstRank);
    const SecondPriority = GetRankPriority(SecondRank);

    if (FirstPriority === undefined && SecondPriority === undefined) {
        return SortCollator.compare(FirstRank || "", SecondRank || "");
    };

    if (FirstPriority === undefined) return 1;
    if (SecondPriority === undefined) return -1;

    return SecondPriority - FirstPriority;
};

const CompareStaffNames = (FirstMember: TeamMember, SecondMember: TeamMember) => {
    return SortCollator.compare(FirstMember.username || "", SecondMember.username || "");
};

const NormalizePlayerName = (Name: string | null | undefined) => {
    return String(Name || "")
    .trim()
    .toLowerCase();
};

function RosterHeader({title: Title}: {title: string}) {
    return (
        <div className="flex h-12 shrink-0 items-center border-b border-zinc-800 px-4">
            <h2 className="truncate text-sm font-semibold text-zinc-200">{Title}</h2>
        </div>
    );
}

export default function Page() {
    const [Loading, setLoading] = useState(true);
    const [TeamData, setTeamData] = useState<TeamData>(EmptyTeamData);
    const [LastUpdated, setLastUpdated] = useState<string | null>(null);
    const [CurrentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const Controller = new AbortController();
        let RetryTimer: ReturnType<typeof setTimeout> | null = null;
        let RefreshTimer: ReturnType<typeof setTimeout> | null = null;
        let HasLoaded = false;

        const ScheduleRefresh = () => {
            const NextRefreshAt = GetNextRefreshAt();

            if (RefreshTimer) {
                window.clearTimeout(RefreshTimer);
            };

            RefreshTimer = window.setTimeout(FetchData, Math.max(0, NextRefreshAt - Date.now()));
        };

        const FetchData = async () => {
            try {
                const Response = await fetch(`${Config.API_URL}/team`, {signal: Controller.signal});

                if (!Response.ok) {
                    throw new Error(`Request failed with status ${Response.status}`);
                };

                const TeamJson = await Response.json() as TeamResponse;
                const NextTeamData = IsTeamData(TeamJson.data) ? TeamJson.data : EmptyTeamData;

                setTeamData(NextTeamData);
                setLastUpdated(TeamJson.last_updated || NextTeamData.updated_at);
                HasLoaded = true;
                setLoading(false);
                ScheduleRefresh();

                if (RetryTimer) {
                    window.clearTimeout(RetryTimer);
                    RetryTimer = null;
                };
            } catch {
                if (Controller.signal.aborted) return;

                if (!HasLoaded) {
                    setLoading(true);
                } else {
                    ScheduleRefresh();
                    return;
                };

                if (RetryTimer) {
                    window.clearTimeout(RetryTimer);
                };

                RetryTimer = window.setTimeout(FetchData, 5000);
            };
        };

        FetchData();

        return () => {
            Controller.abort();
            if (RetryTimer) window.clearTimeout(RetryTimer);
            if (RefreshTimer) window.clearTimeout(RefreshTimer);
        };
    }, []);

    useEffect(() => {
        const CountdownTimer = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(CountdownTimer);
        };
    }, []);

    const Stats = useMemo<StatItem[]>(() => {
        const StaffCount = TeamData.staff.length;
        const OnlineStaffCount = TeamData.staff.filter((Member) => Member.is_online).length;
        const CurrentPlayers = TeamData.servers.reduce((Total, Server) => Total + (Server.current_players || 0), 0);
        const MaxPlayers = TeamData.servers.reduce((Total, Server) => Total + (Server.max_players || 0), 0);
        const OnlineServers = TeamData.servers.filter((Server) => !Server.error).length;

        return [
            {
                label: "Players Online",
                value: `${CurrentPlayers}/${MaxPlayers || 0}`,
                detail: `${TeamData.servers.length} server${TeamData.servers.length === 1 ? "" : "s"} are tracked.`,
                Icon: Users,
            },
            {
                label: "Staff Online",
                value: `${OnlineStaffCount}/${StaffCount}`,
                detail: "Matched by steam name.",
                Icon: UserCheck,
            },
            {
                label: "Servers Online",
                value: `${OnlineServers}/${TeamData.servers.length}`,
                detail: `${TeamData.servers.length - OnlineServers} servers are offline.`,
                Icon: ServerIcon,
            },
        ];
    }, [TeamData]);

    const SortedStaff = useMemo(() => {
        return [...TeamData.staff].sort((FirstMember, SecondMember) => {
            return CompareRankValues(FirstMember.rank, SecondMember.rank) || CompareStaffNames(FirstMember, SecondMember);
        });
    }, [TeamData.staff]);

    const OnlineStaffByName = useMemo(() => {
        const StaffMap = new Map<string, TeamMember>();

        for (const Member of TeamData.staff) {
            if (!Member.is_online) continue;

            const StaffName = NormalizePlayerName(Member.online?.name || Member.username);
            if (!StaffName) continue;

            StaffMap.set(StaffName, Member);
        };

        return StaffMap;
    }, [TeamData.staff]);

    const PublicPlayers = useMemo<PublicPlayer[]>(() => {
        return TeamData.servers.flatMap((Server) => {
            return (Server.players || []).map((Player, Index) => ({
                ...Player,
                key: `${Server.host}:${Server.port}:${Index}:${Player.name || "unknown"}:${Player.duration ?? 0}`,
                server_name: Player.server?.name || GetServerName(Server),
                staff: OnlineStaffByName.get(NormalizePlayerName(Player.name)),
            }));
        });
    }, [OnlineStaffByName, TeamData.servers]);

    const TopbarContent = useMemo(() => {
        if (Loading) return null;

        return (
            <div className="ml-1 flex min-w-0 flex-col">
                <h1 className="text-lg font-semibold text-gray-200">Dashboard</h1>
                <p className="text-xs text-zinc-500">Last updated {FormatUpdatedAgo(LastUpdated, CurrentTime)}!</p>
            </div>
        );
    }, [CurrentTime, LastUpdated, Loading]);

    useLayoutTopbar(TopbarContent, Loading);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {Loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <RefreshCw className="animate-spin h-24 w-24 text-zinc-300"/>
                </div>
            ) : (
                <>
                    <div className="theme-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 xl:overflow-hidden">
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                            {Stats.map(({label: Label, value: Value, detail: Detail, Icon}) => (
                                <div key={Label} className="rounded-md border border-zinc-800/75 bg-zinc-950/75 p-2 md:p-4">
                                    <div className="flex items-center justify-between gap-2 md:items-start md:gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-[10px] font-medium text-zinc-400 md:text-sm">{Label}</p>
                                            <p className="mt-1 truncate text-lg font-semibold text-white md:mt-2 md:text-3xl">{Value}</p>
                                        </div>

                                        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-lime-300 sm:flex">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <p className="mt-3 hidden text-xs text-zinc-500 md:block">{Detail}</p>
                                </div>
                            ))}
                        </div>

                        <div className="shrink-0 rounded-md border border-yellow-400/20 bg-yellow-400/6 px-3 py-2">
                            <div className="flex min-w-0 items-start gap-2">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center text-yellow-200">
                                    <TriangleAlert className="h-4 w-4" />
                                </div>

                                <p className="min-w-0 text-xs leading-5 text-yellow-100/80">
                                    Online staff count is not accurate as its based by the Steam account name.
                                </p>
                            </div>
                        </div>

                        <div className="grid min-h-180 grid-cols-1 gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                            <section className="flex min-h-90 min-w-0 flex-col overflow-hidden rounded-md border border-zinc-800/75 bg-zinc-950/75 xl:min-h-0">
                                <RosterHeader title="Staff Roster" />

                                <Table containerClassName="theme-scrollbar flex-1 overflow-auto" className="min-h-180 table-fixed xl:min-w-0">
                                    <colgroup>
                                        <col className="w-[24%]" />
                                        <col className="w-[24%]" />
                                        <col className="w-[21%]" />
                                        <col className="w-[16%]" />
                                        <col className="w-[15%]" />
                                    </colgroup>

                                    <TableHeader>
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="px-4 text-left text-zinc-400">Name</TableHead>
                                            <TableHead className="text-center text-zinc-400">SteamID</TableHead>
                                            <TableHead className="text-center text-zinc-400">DiscordID</TableHead>
                                            <TableHead className="text-center text-zinc-400">Rank</TableHead>
                                            <TableHead className="px-4 text-right text-zinc-400">Timezone</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {SortedStaff.map((Member, Index) => (
                                            <TableRow key={`${Member.discord_id || GetSteamID(Member) || Member.username || "staff"}-${Index}`} className="border-zinc-800 hover:bg-zinc-900/60">
                                                <TableCell className="px-4 text-left">
                                                    <Link key={Member.discord_id} to={`/lookup?input=${encodeURIComponent(GetSteamID(Member))}`} className="block truncate font-medium text-gray-300 hover:text-blue-500 hover:underline underline-offset-2">
                                                        {Member.username || "Unknown"}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="truncate text-center font-mono text-xs text-zinc-400">{GetSteamID(Member)}</TableCell>
                                                <TableCell className="truncate text-center font-mono text-xs text-zinc-400">{Member.discord_id || "-"}</TableCell>
                                                <TableCell className="truncate text-center text-zinc-300">{Member.rank || "Unranked"}</TableCell>
                                                <TableCell className="truncate px-4 text-right text-zinc-400">{Member.timezone || "-"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </section>

                            <section className="flex min-h-90 min-w-0 flex-col overflow-hidden rounded-md border border-zinc-800/75 bg-zinc-950/75 xl:min-h-0">
                                <RosterHeader title="Currently Online" />

                                <Table containerClassName="theme-scrollbar flex-1 overflow-auto" className="min-w-150 table-fixed xl:min-w-0">
                                    <colgroup>
                                        <col className="w-[44%]" />
                                        <col className="w-[22%]" />
                                        <col className="w-[12%]" />
                                        <col className="w-[22%]" />
                                    </colgroup>

                                    <TableHeader>
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="px-4 text-left text-zinc-400">Name</TableHead>
                                            <TableHead className="text-center text-zinc-400">Server</TableHead>
                                            <TableHead className="text-center text-zinc-400">Score</TableHead>
                                            <TableHead className="px-4 text-right text-zinc-400">Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {PublicPlayers.map((Player) => (
                                            <TableRow key={Player.key} className="border-zinc-800 hover:bg-zinc-900/60">
                                                <TableCell className="px-4 text-left">
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <span className="min-w-0 truncate font-medium text-gray-200">{Player.name || "Unknown Player"}</span>
                                                        {Player.staff && (
                                                            <span className="shrink-0 rounded-sm border border-lime-500/30 bg-lime-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-lime-300">
                                                                {`${Player.staff.rank || "Unranked"}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="truncate text-center text-xs text-zinc-400">{Player.server_name}</TableCell>
                                                <TableCell className="truncate text-center font-mono text-xs text-zinc-400">{FormatPlayerScore(Player)}</TableCell>
                                                <TableCell className="truncate px-4 text-right font-mono text-xs text-zinc-400">{FormatPlayerDuration(Player)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </section>
                        </div>
                    </div>

                    <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                        <div className="h-10" />
                    </div>
                </>
            )}
        </div>
    );
};
