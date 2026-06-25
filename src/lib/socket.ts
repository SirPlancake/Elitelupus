import { io, Socket } from "socket.io-client";

let APISocket: Socket;

export function GetSocket() {
    if (!APISocket) {
        APISocket = io({
            transports: ["websocket"],
            autoConnect: false,
        });
    }

    return APISocket;
}