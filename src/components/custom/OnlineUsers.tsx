import { useEffect, useState } from "react";
import { GetSocket } from "@/lib/socket";
import {Eye} from "lucide-react";

export default function OnlineUsers() {
    const [OnlineUsers, setOnlineUsers] = useState(0);

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
        <span className="inline-flex items-center gap-1.5 text-gray-400" aria-label={`${OnlineUsers} users online`}>
            <Eye className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{OnlineUsers}</span>
        </span>
    );
}
