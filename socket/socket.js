// backend/socket.js
import { Server } from "socket.io";

let io;

/**
 * Initialize Socket.IO server with auto-join logic
 * Clients provide branchCode and role in handshake query params
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const { branchCode, role } = socket.handshake.query;

    console.log(
      `Socket connected: ${socket.id} | Role: ${role} | Branch: ${branchCode}`
    );

    // Auto-join branch room if branchCode is provided
    if (branchCode && branchCode !== "undefined" && branchCode !== "null") {
      socket.join(`branch:${branchCode}`);
      console.log(`Socket ${socket.id} auto-joined room: branch:${branchCode}`);
    }

    // Auto-join admins room if role is admin
    if (role === "admin") {
      socket.join("admins");
      console.log(`Socket ${socket.id} auto-joined room: admins`);
    }

    // Manual join-branch event (for backwards compatibility)
    socket.on("join-branch", (branchCodeParam) => {
      if (branchCodeParam) {
        socket.join(`branch:${branchCodeParam}`);
        console.log(
          `Socket ${socket.id} manually joined branch:${branchCodeParam}`
        );
      }
    });

    // Manual join-admins event
    socket.on("join-admins", () => {
      socket.join("admins");
      console.log(`Socket ${socket.id} manually joined admins room`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
