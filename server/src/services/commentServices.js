import supabase from "../config/supabaseClient.js";
import { validate as isUUID } from "uuid";
import roles from "../constant/roles.js";

export async function createComment(ticketId, comment, user) {
    try {

        // Validate ticket ID
        if (!isUUID(ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }

        // Validate comment
        if (!comment || !comment.trim()) {
            return {
                status: 400,
                message: "Comment is required"
            };
        }

        // Find ticket and verify organization
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("ticket_id, org_id, created_by, assigned_to")
            .eq("ticket_id", ticketId)
            .eq("org_id", user.org_id)
            .maybeSingle();

        if (ticketError) {
            console.log("TICKET FETCH ERROR:", ticketError);

            return {
                status: 500,
                message: "Failed to fetch ticket"
            };
        }

        if (!ticket) {
            return {
                status: 404,
                message: "Ticket not found"
            };
        }

        // Role-based authorization

        // Admin can comment on any ticket in their organization
        if (user.role === roles.ADMIN) {
            // Allowed
        }

        // Agent can comment only on tickets assigned to them
        else if (user.role === roles.AGENT) {
            if (ticket.assigned_to !== user.user_id) {
                return {
                    status: 403,
                    message: "You are not assigned to this ticket"
                };
            }
        }

        // User can comment only on tickets created by them
        else if (user.role === roles.USER) {
            if (ticket.created_by !== user.user_id) {
                return {
                    status: 403,
                    message: "You are not allowed to comment on this ticket"
                };
            }
        }

        // Super Admin is V2
        else {
            return {
                status: 403,
                message: "You are not allowed to comment"
            };
        }

        // Create comment
        const { data: newComment, error: commentError } = await supabase
            .from("comments")
            .insert([
                {
                    ticket_id: ticketId,
                    user_id: user.user_id,
                    org_id: user.org_id,
                    comment: comment.trim()
                }
            ])
            .select()
            .single();

        if (commentError) {
            console.log("COMMENT CREATION ERROR:", commentError);

            return {
                status: 500,
                message: "Failed to create comment"
            };
        }

        return {
            status: 201,
            message: "Comment created successfully",
            comment: newComment
        };

    } catch (err) {
        console.log("COMMENT CREATION ERROR:", err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}

export async function getCommentsByTicket(ticketId, user) {
    try {

        // Validate ticket ID
        if (!isUUID(ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }

        // Find ticket and verify organization
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("ticket_id, org_id, created_by, assigned_to")
            .eq("ticket_id", ticketId)
            .eq("org_id", user.org_id)
            .maybeSingle();

        if (ticketError) {
            console.log("TICKET FETCH ERROR:", ticketError);

            return {
                status: 500,
                message: "Failed to fetch ticket"
            };
        }

        if (!ticket) {
            return {
                status: 404,
                message: "Ticket not found"
            };
        }

        // Role-based authorization

        // Admin can view comments on any ticket in their organization
        if (user.role === roles.ADMIN) {
            // Allowed
        }

        // Agent can view comments only on tickets assigned to them
        else if (user.role === roles.AGENT) {
            if (ticket.assigned_to !== user.user_id) {
                return {
                    status: 403,
                    message: "You are not allowed to view this conversation"
                };
            }
        }

        // User can view comments only on tickets created by them
        else if (user.role === roles.USER) {
            if (ticket.created_by !== user.user_id) {
                return {
                    status: 403,
                    message: "You are not allowed to view this conversation"
                };
            }
        }

        // Super Admin is V2
        else {
            return {
                status: 403,
                message: "You are not allowed to view comments"
            };
        }

        // Fetch comments
        const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select("*")
            .eq("ticket_id", ticketId)
            .eq("org_id", user.org_id)
            .order("created_at", { ascending: true });

        if (commentsError) {
            console.log("COMMENTS FETCH ERROR:", commentsError);

            return {
                status: 500,
                message: "Failed to fetch comments"
            };
        }

        return {
            status: 200,
            message: "Comments fetched successfully",
            comments: comments
        };

    } catch (err) {
        console.log("GET COMMENTS ERROR:", err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}