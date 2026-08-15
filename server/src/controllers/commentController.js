import * as commentService from "../services/commentServices.js"
export async function createComment(req, res) {
    try {
        const ticketId = req.params.id;
        const comment = req.body.comment;
        const user = req.user;

        const result = await commentService.createComment(ticketId, comment, user);
        return res.status(result.status).json(result)

    } catch (err) {
        console.log("CREATE COMMENT CONTROLLER ERROR:", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getCommentsByTicket(req, res) {
    try {

        const ticketId = req.params.id;
        const user = req.user;
        const result = await commentService.getCommentsByTicket(ticketId, user);
        return res.status(result.status).json(result)

    } catch (err) {
        console.log("GET COMMENTS CONTROLLER ERROR:", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}