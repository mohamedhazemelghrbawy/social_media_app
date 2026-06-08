import { Server } from "socket.io";
import chatGateway from "../chat/realtime/chat.gateway.js";
import { Server as httpServer } from "http";
import { decodeToken_and_fetchUser } from "../../common/middleware/authentication.js";
import redisService from "../../common/services/redis.service.js";
class SocketGateway {
  constructor() {}

  initIo = async (httpServer: httpServer) => {
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    io.use(async (socket, next) => {
      // console.log("middleware entered");
      // console.log(socket.handshake.auth);

      try {
        const token =
          socket.handshake.auth.authorization ||
          socket.handshake.headers.authorization;

        console.log("TOKEN =", token);

        const { user } = await decodeToken_and_fetchUser(token);

        // console.log("USER =", user._id);

        socket.data.user = user;
        // console.log("USER FROM API:", { user });
        // console.log("FRIENDS:", user.friends);

        next();
      } catch (error) {
        console.log("AUTH ERROR =", error);
        next(error as any);
      }
    });

    io.on("connection", async (socket) => {
      console.log("CONNECTED", socket.id);
      await redisService.addSocket({
        userId: socket.data.user._id,
        SocketId: socket.id,
      });

      await chatGateway.registerEvents(socket, io);

      console.log({
        useSocketsIds: await redisService.getSockets(socket.data.user._id),
      });
      socket.on("disconnect", async () => {
        await redisService.removeSocket({
          userId: socket.data.user._id,
          SocketId: socket.id,
        });
        console.log({
          useSocketsIdsAfterDisconnect: await redisService.getSockets(
            socket.data.user._id,
          ),
        });
      });
    });
  };
}
export default new SocketGateway();
