
import supabase from "../config/supabaseClient.js";
import allowedPriorities from "../constant/ticketPriorities.js";
import { validate as isUUID } from "uuid";
import roles from "../constant/roles.js"

export async function createTicket(ticketData) {
    const { title, description, priority } = ticketData;

    if (
        !title || !description || !priority || !title.trim() || !description.trim()
    ) {
        return {
            status: 400,
            message: "All fields are required"
        };
    }
    if (
        !allowedPriorities.includes(priority) ||
        typeof priority !== "string"
    ) {
        return {
            status: 400,
            message: "Invalid priority"
        };
    }
    const ticketToInsert = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: "Open",
        created_by: ticketData.created_by,
        org_id: ticketData.org_id
    };

    try {
        const { data: tickets, error: ticketCreationError } =
            await supabase
                .from("tickets")
                .insert([ticketToInsert])
                .select()
                .single();
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
        const { data: getTickets, error: getTicketsError } = await supabase
            .from("tickets")
            .select("*, assigned_user:users!assigned_to(name)")
            .eq("org_id", org_id);
        if (getTicketsError) {
            return {
                status: 500,
                message: "Failed to fetch tickets"
            }
        }
        return {
            status: 200,
            message: "tickets fetched successfully",
            tickets: getTickets ? getTickets.map(t => {
                const { assigned_user, ...rest } = t;
                return {
                    ...rest,
                    assigned_to: assigned_user?.name || null
                };
            }) : []
        }
    } catch (err) {
        console.log(err);
        return {
            status: 500,
            message: "Internal server error"
        }

    }

}

export async function getTicketbyId(
    ticketId,
    userId,
    userOrgId,
    userRole
) {
    console.log("GET TICKET SERVICE HIT");

    try {
        console.log("TICKET ID:", ticketId);
        console.log("USER ID:", userId);
        console.log("USER ORG ID:", userOrgId);
        console.log("USER ROLE:", userRole);

        if (!isUUID(ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }

        const { data: ticket, error: ticketByIdError } = await supabase
            .from("tickets")
            .select("*, assigned_user:users!assigned_to(name)")
            .eq("ticket_id", ticketId)
            .eq("org_id", userOrgId)
            .single();

        if (ticketByIdError) {
            if (ticketByIdError.code === "PGRST116") {
                return {
                    status: 404,
                    message: "Ticket not found"
                };
            }

            return {
                status: 500,
                message: "Internal server error"
            };
        }

        // Role 3 = User
        // Users can only view tickets they created.
        if (userRole === 3 && ticket.created_by !== userId) {
            return {
                status: 403,
                message: "You do not have permission to view this ticket"
            };
        }

        let mappedTicket = null;

        if (ticket) {
            const { assigned_user, ...rest } = ticket;

            mappedTicket = {
                ...rest,
                assigned_to: assigned_user?.name || null
            };
        }

        return {
            status: 200,
            message: "Ticket fetched successfully",
            ticket: mappedTicket
        };

    } catch (err) {
        console.error("GET TICKET ERROR:", err);

        return {
            status: 500,
            message: err.message
        };
    }
}

export async function updateTicket(ticketId, updatedData, org_id) {

    try {
        console.log("TICKET ID:", ticketId);
        console.log("USER ORG ID:", org_id);
        if (
            !updatedData.title || !updatedData.description || !updatedData.priority || !updatedData.title.trim() || !updatedData.description.trim()
        ) {
            return {
                status: 400,
                message: "All fields are required"
            };
        }

        if (!allowedPriorities.includes(updatedData.priority)) {
            return {
                status: 400,
                message: "Invalid priority"
            }
        }

        //extra security
        const editableData = {
            title: updatedData.title,
            description: updatedData.description,
            priority: updatedData.priority
        }
        if (!isUUID(ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }
        const { data: updateTicket, error: updateTicketError } = await supabase.from("tickets").update(editableData).eq("ticket_id", ticketId).eq("org_id", org_id).select().single();
        if (updateTicketError) {
            if (updateTicketError.code === "PGRST116") {
                return {
                    status: 404,
                    message: "Ticket not found"
                };
            }

            return {
                status: 500,
                message: "Failed to update ticket"
            };
        }

        return {
            status: 200,
            message: "Ticket updated successfully",
            ticket: updateTicket
        };
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
        if (!isUUID(ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }
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
        if (!isUUID(info.ticketId)) {
            return {
                status: 400,
                message: "Invalid ticket ID"
            };
        }
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

            if (ticket.assigned_to !== null && ticket.assigned_to !== undefined) {
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
            if (ticket.assigned_to !== null && ticket.assigned_to !== undefined) {
                return {
                    status: 400,
                    message: "Ticket is already assigned"
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
                status: "Assigned"
            })
            .eq("ticket_id", info.ticketId)
            .eq("org_id", info.org_id)
            .select("*, assigned_user:users!assigned_to(name)")
            .single();

        if (updateError) {
            return {
                status: 500,
                message: "Failed to assign ticket"
            };
        }

        let mappedTicket = null;
        if (updatedTicket) {
            const { assigned_user, ...rest } = updatedTicket;
            mappedTicket = {
                ...rest,
                assigned_to: assigned_user?.name || null
            };
        }

        return {
            status: 200,
            message: "Ticket assigned successfully",
            ticket: mappedTicket
        };

    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: "Internal server error"
        };
    }
}

export async function getAgents(org_id) {
    try {
        const { data: agents, error } = await supabase
            .from("users")
            .select("user_id, name, email, role")
            .eq("org_id", org_id)
            .eq("role", 2); // role 2 is AGENT

        if (error) {
            return {
                status: 500,
                message: "Failed to fetch agents"
            };
        }

        return {
            status: 200,
            message: "Agents fetched successfully",
            agents
        };
    } catch (err) {
        console.log(err);
        return {
            status: 500,
            message: "Internal server error"
        };
    }
}