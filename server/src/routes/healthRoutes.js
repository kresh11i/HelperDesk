import express from "express";
import { healthChecker } from "../controllers/healthController.js";

const router = express.Router();
router.get("/health", healthChecker);
export default router;