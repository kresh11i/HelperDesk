
import supabase from "../config/supabaseClient.js";

export async function createTicket(ticketData) {
    const { title, description, priority } = ticketData;
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

export async function getTicketbyId(ticket_id, org_id) {
    try {
        const { data: ticket, error: ticketByIdError } = await supabase.from("tickets").select().eq("ticket_id", ticket_id).eq("org_id", org_id).single();
        if (ticketByIdError) {
            return {
                status: 500,
                message: "Internal server error"
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
            message: "Internal server error"
        }
    }

}

export async function updateTicket(ticketId, updatedData, org_id) {
    try {
        const { data: updateTicket, error: updateTicketError } = await supabase.from("tickets").update(updatedData).eq("ticket_id", ticketId).eq("org_id", org_id).select().single();
        if (updateTicketError) {
            return {
                status: 500,
                message: "Failed to update ticket."
            }
        }
        return {
            status: 200,
            message: "Ticket updated successfully",
            ticket: updateTicket
        }
    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: "Internal server error"
        }
    }

}

export async function deleteTicket(ticketId, org_id) {
    try {
        const { data: delTicket, error: delTicketError } = await supabase.from("tickets").delete().eq("ticket_id",ticketId).eq("org_id", org_id);
        if (delTicketError) {
            return {
                status: 500,
                message: "Failed to delete ticket."
            }
        }
        return {
            status: 200,
            message: "Ticket deleted successfully",
        }
    } catch (err) {
        console.log(err);

        return {
            status: 500,
            message: "Internal server error"
        }
    }

}