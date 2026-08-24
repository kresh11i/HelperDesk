//Dependencies
import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import healthRoutes from "./routes/healthRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import ticketRoutes from "./routes/ticketRoutes.js"
import commentRoutes from "./routes/commentRoutes.js";
import { authenticateUser, authorizeRole } from './middleware/authMiddleware.js';



import orgRoutes from "./routes/orgRoutes.js";

const app = express();
const corsPolicy = {

    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    credentials: true

};

//middlewares
app.use(cors(corsPolicy));
app.use(express.json());
app.use(morgan('dev'))

//usage of routes
app.use("/auth", authRoutes);
app.use("/health", authenticateUser, authorizeRole(3), healthRoutes);
app.use("/tickets", authenticateUser, ticketRoutes);
app.use("/tickets", authenticateUser, commentRoutes);
app.use("/org", orgRoutes);

export default app;