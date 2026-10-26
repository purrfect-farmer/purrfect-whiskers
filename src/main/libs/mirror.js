import { MIRROR } from "../../shared/constants/ipc";
import { Server } from "socket.io";
import { createServer } from "http";
import { networkInterfaces } from "os";

/** Starts the mirror socket server, resolving with its addresses */
export function createMirrorServer() {
  return new Promise((resolve, reject) => {
    /** The server port */
    const PORT = MIRROR.PORT;
    /** The HTTP server */
    const server = createServer();
    /** The socket server */
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    /** Add each socket to the receivers and relay its messages to them */
    io.on("connection", (socket) => {
      socket.join(MIRROR.ROOM_RECEIVERS);

      socket.on(MIRROR.EVENT_MESSAGE, (arg) => {
        socket.to(MIRROR.ROOM_RECEIVERS).emit(MIRROR.EVENT_COMMAND, arg);
      });
    });

    /** Start Server */
    server.on("error", reject).listen(PORT, (error) => {
      if (error) return reject(error);

      /** The network interfaces */
      const nets = networkInterfaces();
      /** The IPv4 addresses of the server */
      const addresses = [];

      for (const interfaces of Object.values(nets)) {
        for (const net of interfaces) {
          /** The IPv4 family value, a string or a number */
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
