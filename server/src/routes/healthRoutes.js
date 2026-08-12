import express from "express";
import { healthChecker } from "../controllers/healthController.js";

const router = express.Router();
router.get("/", healthChecker);
export default router;