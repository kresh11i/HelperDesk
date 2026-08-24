import express from "express";
import {
    createTicket, getAllTickets, getTicketbyId, updateTicket, deleteTicket,
    assignTicket,
    updateTicketStatus,
    getAgents
} from "../controllers/ticketController.js";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware.js";
import roles from "../constant/roles.js";
import { createComment, getCommentsByTicket } from "../controllers/commentController.js";

const router = express.Router();
router.post("/", createTicket);
router.get("/", getAllTickets);
router.get("/agents/list", authorizeRole(roles.ADMIN, roles.AGENT), getAgents);
router.get("/:id", getTicketbyId);
router.put("/:id", updateTicket);
router.delete("/:id", authorizeRole(roles.ADMIN), deleteTicket);
router.patch("/:id/assign", authorizeRole(roles.ADMIN, roles.AGENT), assignTicket);
router.patch("/:id/status", updateTicketStatus);
console.log("TICKET ROUTES LOADED");
export default router;