
import supabase from "../config/supabaseClient.js";

export async function createTicket(ticketData) {
    const { title, description, priority } = ticketData;
    if (!title || !description || !priority) {
        return {
            status: 400,
            message: "All fields requried"
        }
    }
    try {
        const { data: tickets, error: ticketCreationError } = await supabase.from("tickets").insert([ticketData]).select().single();
        console.log(ticketCreationError);
        if (ticketCreationError) {
            return {
                status: 500,
                message: "Database error. Ticket could not be created."
            }
        }

        return {
            status: 201,
            message: "Ticket created successfully",
            ticket: tickets
        }

    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: err.message,
        };
    }

}

export async function getAllTickets(org_id) {
    try {
        const { data: getTickets, error: getTicketsError } = await supabase.from("tickets").select().eq("org_id", org_id)
        if (getTicketsError) {
            return {
                status: 500,
                message: "Failed to fetch tickets"
            }
        }
        return {
            status: 200,
            message: "tickets fetched successfully",
            tickets: getTickets
        }
    } catch (err) {
        console.log(err);
        return {
            status: 500,
            message: "Internal server error"
        }

    }

}

export async function getTicketbyId(ticketId, org_id) {
    console.log("GET TICKET CONTROLLER HIT");

    try {
        console.log("TICKET ID:", ticketId);
        console.log("USER ORG ID:", org_id);
        const { data: ticket, error: ticketByIdError } = await supabase.from("tickets").select().eq("ticket_id", ticketId).eq("org_id", org_id).single();
        if (ticketByIdError) {
            console.log("GET TICKET ERROR:", ticketByIdError);

            return {
                status: 500,
                message: ticketByIdError.message
            }
        }
        return {
            status: 200,
            message: "Ticket fetched successfully",
            ticket: ticket,
        }

    } catch (err) {
        return {
            status: 500,
            message: err.message
        }
    }

}

export async function updateTicket(ticketId, updatedData, org_id) {
    try {
        console.log("TICKET ID:", ticketId);
        console.log("USER ORG ID:", org_id);
        const { data: updateTicket, error: updateTicketError } = await supabase.from("tickets").update(updatedData).eq("ticket_id", ticketId).eq("org_id", org_id).select().single();
        if (!updatedData.title ||
            !updatedData.description ||
            !updatedData.priority) {
            return {
                status: 404,
                message: "All field requried"
            }
        }
        if (updateTicketError) {
            console.log("SUPABASE UPDATE ERROR:", updateTicketError);

            return {
                status: 500,
                message: updateTicketError.message
            }
        }
        return {
            status: 200,
            message: "Ticket updated successfully",
            ticket: updateTicket
        }
    } catch (err) {
        console.log(err.message);

        return {
            status: 500,
            message: "Internal server error am hit"
        }
    }

}

export async function deleteTicket(ticketId, org_id) {
    try {
        const {
            data: delTicket,
            error: delTicketError
        } = await supabase
            .from("tickets")
            .delete()
            .eq("ticket_id", ticketId)
            .eq("org_id", org_id)
            .select()
            .single();

        if (delTicketError) {
            if (delTicketError.code === "PGRST116") {
                return {
                    status: 404,
                    message: "Ticket not found"
                };
            }

            return {
                status: 500,
                message: "Failed to delete ticket."
            };
        }

        return {
            status: 200,
            message: "Ticket deleted successfully"
        };

    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}

export async function assignTicket(info) {
    try {

        // Find ticket
        const { data: ticket, error: assignError } = await supabase
            .from("tickets")
            .select()
            .eq("ticket_id", info.ticketId)
            .eq("org_id", info.org_id)
            .maybeSingle();

        if (assignError) {
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

        // Determine target Agent
        let target;

        // Agent self-assignment
        if (info.role === 2) {

            if (ticket.assigned_to !== null) {
                return {
                    status: 400,
                    message: "Ticket is already assigned"
                };
            }

            target = info.userId;

            // Admin assignment
        } else if (info.role === 1) {

            if (!info.assignedTo) {
                return {
                    status: 400,
                    message: "Agent user_id is required"
                };
            }

            target = info.assignedTo;

        } else {
            return {
                status: 403,
                message: "You are not allowed to assign tickets"
            };
        }

        // Validate target Agent
        const { data: targetAgent, error: agentError } = await supabase
            .from("users")
            .select("user_id, org_id, role")
            .eq("user_id", target)
            .eq("org_id", info.org_id)
            .eq("role", 2)
            .maybeSingle();

        if (agentError) {
            return {
                status: 500,
                message: "Failed to validate Agent"
            };
        }

        if (!targetAgent) {
            return {
                status: 400,
                message: "Invalid Agent or Agent belongs to another organization"
            };
        }

        // Update ticket assignment
        const { data: updatedTicket, error: updateError } = await supabase
            .from("tickets")
            .update({
                assigned_to: target,
                status:"Assigned"
            })
            .eq("ticket_id", info.ticketId)
            .eq("org_id", info.org_id)
            .select()
            .single();

        if (updateError) {
            return {
                status: 500,
                message: "Failed to assign ticket"
            };
        }

        return {
            status: 200,
            message: "Ticket assigned successfully",
            ticket: updatedTicket
        };

    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}