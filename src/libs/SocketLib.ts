import * as SocketIO from "socket.io-client";

let APISocket: SocketIO.Socket;

export function GetSocket() {
    if (!APISocket) {
        APISocket = SocketIO.io({
            transports: ["websocket"],
            autoConnect: false,
        });
    };

    return APISocket;
};