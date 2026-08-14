import express from "express";
import * as  ticketServices from "../services/ticketServices.js"

export async function createTicket(req, res) {
    const { title, description, priority } = req.body;

    try {
        console.log(req.user);
        const ticketData = {
            title: title,
            description: description,
            priority: priority,
            status: "Open",
            created_by: req.user.user_id,
            org_id: req.user.org_id
        };
        console.log(ticketData);
        const result = await ticketServices.createTicket(ticketData);
        return res.status(result.status).json(result)
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });

    }


}
export async function getAllTickets(req, res) {
    try {
        const result = await ticketServices.getAllTickets(req.user.org_id);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function getTicketbyId(req, res) {
    console.log("GET TICKET CONTROLLER HIT");

    try {
        console.log("PARAMS:", req.params);
        console.log("USER:", req.user);

        const ticketId = req.params.id;

        console.log("TICKET ID FROM PARAM:", ticketId);
        console.log("ORG ID FROM USER:", req.user.org_id);

        const result = await ticketServices.getTicketbyId(
            ticketId,
            req.user.org_id
        );

        console.log("SERVICE RESULT:", result);

        return res.status(result.status).json(result);

    } catch (err) {
        console.log("CONTROLLER ERROR:", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function updateTicket(req, res) {
    try {
        const ticketId = req.params.id;
        const updatedData = req.body;

        const result = await ticketServices.updateTicket(ticketId, updatedData, req.user.org_id);
        return res.status(result.status).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Internal server error"
        })

    }
}
export async function deleteTicket(req, res) {
    try {
        const ticketId = req.params.id;
        const result = await ticketServices.deleteTicket(ticketId, req.user.org_id);
        return res.status(result.status).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

//assigning tickets
// assigning tickets
export async function assignTicket(req, res) {
    try {
        const info = {
            ticketId: req.params.id,
            userId: req.user.user_id,
            org_id: req.user.org_id,
            role: req.user.role,
            assignedTo: req.body.assigned_to
        };

        const result = await ticketServices.assignTicket(info);

        return res.status(result.status).json(result);

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}