import express from "express";
import {
    createTicket, getAllTickets, getTicketbyId, updateTicket, deleteTicket
} from "../controllers/ticketController.js";

const router = express.Router();
router.post("/",createTicket);
router.get("/",getAllTickets);
router.get("/:id",getTicketbyId);
router.put("/:id",updateTicket);
router.delete("/:id",deleteTicket);
export default router;