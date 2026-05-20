import { useEffect, useState } from "react";
import { GetSocket } from "@/lib/socket";

export default function OnlineUsers() {
    const [OnlineUsers, setOnlineUsers] = useState<number>(0);

    useEffect(() => {
        const Socket = GetSocket();

        if (!Socket.connected) {
            Socket.connect();
        }

        const HandleOnlineUsers = (Count: number) => {
            setOnlineUsers(Count);
        };

        Socket.on("OnlineUsers", HandleOnlineUsers);

        return () => {
            Socket.off("OnlineUsers", HandleOnlineUsers);
        };
    }, []);

    return (
        <div className="rounded-md bg-zinc-800 px-3 h-10.5 border border-zinc-700 text-gray-300 w-fit flex items-center shrink-0">
            <h1 className="text-sm font-medium whitespace-nowrap">
                Users Online: {OnlineUsers}
            </h1>
        </div>
    );
}