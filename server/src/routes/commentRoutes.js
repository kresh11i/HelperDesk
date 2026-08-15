import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
    createComment,
    getCommentsByTicket
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:id/comments", createComment);
router.get("/:id/comments", getCommentsByTicket);

export default router;