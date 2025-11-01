import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket, getIO } from "./socket/socket.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import adminRegRoutes from "./routes/adminReg.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// initialize Socket.IO with the HTTP server
initSocket(server);
const io = getIO();
app.set("io", io);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Routes
import authRoutes from "./routes/auth.routes.js";
import branchRoutes from "./routes/branches.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import printerRoutes from "./routes/printer.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/printer", printerRoutes);
app.use("/api/admin/", adminRegRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
