//Dependencies
import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";


const app = express();
const corsPolicy = {

    origin: ["http://localhost:5173"],
    credentials: true,

};

//middlewares
app.use(cors(corsPolicy));
app.use(express.json());
app.use(morgan('dev'))

app.get("/health", (req, res) => {
    res.json({
        message: "HelpDesk API is running Client connected"
    });
});

export default app;