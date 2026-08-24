import express from "express";
import * as orgController from "../controllers/orgController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/team", authenticateUser, orgController.getTeam);
router.post("/invite", authenticateUser, orgController.inviteUser);
router.post("/invite/accept", orgController.acceptInvite);
router.patch("/member/:id/role", authenticateUser, orgController.updateRole);

export default router;
