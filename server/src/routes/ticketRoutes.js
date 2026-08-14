import express from "express";
import {
    createTicket, getAllTickets, getTicketbyId, updateTicket, deleteTicket,
    assignTicket,
    updateTicketStatus
} from "../controllers/ticketController.js";
import { authenticateUser, authorizeRole } from "../middleware/authMiddleware.js";
import roles from "../constant/roles.js";

const router = express.Router();
router.post("/", createTicket);
router.get("/", getAllTickets);
router.get("/:id", getTicketbyId);
router.put("/:id", authorizeRole(roles.ADMIN, roles.AGENT), updateTicket);
router.delete("/:id", authorizeRole(roles.ADMIN), deleteTicket);
router.patch("/:id/assign", authorizeRole(roles.ADMIN, roles.AGENT), assignTicket);
router.patch("/:id/status", updateTicketStatus)
console.log("TICKET ROUTES LOADED");
export default router;