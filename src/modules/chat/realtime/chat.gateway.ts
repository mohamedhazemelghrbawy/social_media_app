import { Server, Socket } from "socket.io";
import chatEvernt from "./chat.evernt.js";

class ChatGateway {
  constructor() {}

  async registerEvents(socket: Socket, io: Server) {
    // chatEvernt.hi(socket);
    chatEvernt.sendMessage(socket, io);
  }
}

export default new ChatGateway();
