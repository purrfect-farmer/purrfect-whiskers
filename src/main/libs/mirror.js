import { MIRROR } from "../../shared/constants/ipc";
import { Server } from "socket.io";
import { createServer } from "http";
import { networkInterfaces } from "os";

export function createMirrorServer() {
  return new Promise((resolve, reject) => {
    const PORT = MIRROR.PORT;
    const server = createServer();
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    /** Add to Room */
    io.on("connection", (socket) => {
      socket.join(MIRROR.ROOM_RECEIVERS);

      socket.on(MIRROR.EVENT_MESSAGE, (arg) => {
        socket.to(MIRROR.ROOM_RECEIVERS).emit(MIRROR.EVENT_COMMAND, arg);
      });
    });

    /** Start Server */
    server.on("error", reject).listen(PORT, (error) => {
      if (error) return reject(error);

      const nets = networkInterfaces();
      const addresses = [];

      for (const interfaces of Object.values(nets)) {
        for (const net of interfaces) {
          const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
          if (net.family === familyV4Value) {
            addresses.push(`${net.address}:${PORT}`);
          }
        }
      }

      resolve({ io, server, addresses });
    });
  });
}
