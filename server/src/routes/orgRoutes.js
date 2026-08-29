import express from "express";
import * as orgController from "../controllers/orgController.js";
import { authenticateUser, requireOrganization } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authenticateUser, orgController.createOrganization);
router.post("/invite/accept", authenticateUser, orgController.acceptInvite);

router.get("/team", authenticateUser, requireOrganization, orgController.getTeam);
router.post("/invite", authenticateUser, requireOrganization, orgController.inviteUser);
router.patch("/member/:id/role", authenticateUser, requireOrganization, orgController.updateRole);

export default router;
