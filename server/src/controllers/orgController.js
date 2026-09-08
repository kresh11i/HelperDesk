import * as orgServices from "../services/orgServices.js";

export async function getTeam(req, res) {
    try {
        const result = await orgServices.getTeam(req.user.org_id);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function inviteUser(req, res) {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ message: "Email and role are required" });
        }
        const result = await orgServices.inviteUser(req.user.org_id, email, role, req.user.role);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function createOrganization(req, res) {
    try {
        const { organizationName } = req.body;
        if (!organizationName) {
            return res.status(400).json({ message: "Organization name is required" });
        }
        const result = await orgServices.createOrganization(req.user.user_id, organizationName);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function acceptInvite(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const result = await orgServices.acceptInvite(token, req.user.user_id);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateRole(req, res) {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }
        const result = await orgServices.updateRole(targetUserId, req.user.org_id, role, req.user.role);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function removeMember(req, res) {
    try {
        const targetUserId = req.params.id;
        const result = await orgServices.removeMember(targetUserId, req.user.user_id, req.user.org_id, req.user.role);
        return res.status(result.status).json(result);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
}
