import supabase from "../config/supabaseClient.js";

export async function updateTicketStatus(ticketId, newStatus, user) {
    try {
        console.log("TICKET ID:", ticketId);
        console.log("NEW STATUS:", newStatus);
        console.log("USER:", user);

        // workflow logic will be added here
        const allowedStatuses = [
            "Open",
            "Assigned",
            "In Progress",
            "Resolved",
            "Closed",
            "Reopened"
        ];
        if (!allowedStatuses.includes(newStatus)) {
            return {
                status: 400,
                message: "Invalid ticket status"
            };
        }
        const { data, error } = await supabase.from("tickets").select("*").eq("ticket_id", ticketId).eq("org_id", user.org_id).maybeSingle();

        if (error) {
            return {
                status: 500,
                message: "Internal server error"
            };
        }
        if (data === null) {
            return {
                status: 404,
                message: "Ticket not found"
            };
        }

        const currentStatus = data.status;



        const allowedTransitions = {
            "Open": ["Assigned"],
            "Assigned": ["In Progress"],
            "In Progress": ["Resolved"],
            "Resolved": ["Closed", "Reopened"],
            "Closed": [],
            "Reopened": ["In Progress"]
        };
        console.log("CURRENT STATUS:", currentStatus);
        console.log("NEW STATUS:", newStatus);
        console.log("ALLOWED STATUSES:", allowedStatuses);
        console.log(
            "STATUS VALID:",
            allowedStatuses.includes(newStatus)
        );
        const allowedNextStatuses = allowedTransitions[currentStatus];
        if (!allowedNextStatuses.includes(newStatus)) {
            return {
                status: 400,
                message: "Invalid status transition"
            };
        }

        const userRole = user.role;
        if (user.role === 1 || user.role === 2) {
            allowedTransitions
        } else {
            return {
                status: 403,
                message: "You are not allowed to change ticket status"
            };
        }

        // TODO 3: Check Agent ownership
        if (userRole === 2) {
            if (data.assigned_to !== user.user_id) {
                return {
                    status: 403,
                    message: "You are not assigned to this ticket"
                };
            }
        }
        //update db
        const { data: status, error: statusError } =
            await supabase
                .from("tickets")
                .update({
                    status: newStatus
                })
                .eq("ticket_id", ticketId)
                .eq("org_id", user.org_id)
                .select()
                .single();
        if (statusError) {
            return {
                status: 500,
                message: "Failed to update ticket status"
            };
        }

        return {
            status: 200,
            message: "Ticket status updated successfully",
            data: status
        }
    } catch (err) {
        console.log("STATUS UPDATE ERROR:", err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}

