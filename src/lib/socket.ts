import {io, Socket} from "socket.io-client";
import Config from "../../vite.app.config";

let APISocket: Socket;

export function GetSocket() {
    if (!APISocket) {
        APISocket = io(Config.API_URL, {
            transports: ["websocket"],
            autoConnect: false,
        });
    }

    return APISocket;
};