import { Server, Socket } from "socket.io";
import chatService from "../chat.service.js";

class ChatEvent {
  constructor() {}

  // hi = async (socket: Socket) => {
  //   socket.on("hi", (data: any) => {
  //     chatService.sayHi(data);
  //   });
  // };

  sendMessage = async (socket: Socket, io: Server) => {
    socket.on("sendMessage", (data: any) => {
      chatService.sendMessage(data, socket, io);
    });
  };
}

export default new ChatEvent();
