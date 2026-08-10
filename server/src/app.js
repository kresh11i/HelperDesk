//Dependencies
import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import healthRoutes from "./routes/healthRoutes.js"
import authRoutes from "./routes/authRoutes.js"



const app = express();
const corsPolicy = {

    origin: ["http://localhost:5173"],
    credentials: true,

};

//middlewares
app.use(cors(corsPolicy));
app.use(express.json());
app.use(morgan('dev'))

//usage of routes
app.use("/",healthRoutes);
app.use("/auth" ,authRoutes )


export default app;