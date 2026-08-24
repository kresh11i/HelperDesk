import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { validate as isUUID } from "uuid";

export async function getTeam(org_id) {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("user_id, name, email, role, created_at")
            .eq("org_id", org_id);

        if (error) {
            return { status: 500, message: "Database error" };
        }

        return { status: 200, message: "Team fetched successfully", data };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function inviteUser(org_id, email, role, inviterRole) {
    if (inviterRole !== 1) {
        return { status: 403, message: "Only administrators can invite users" };
    }
    
    try {
        // Check if user already exists
        const { data: existingUser } = await supabase.from("users").select("email").eq("email", email).maybeSingle();
        if (existingUser) {
            return { status: 400, message: "User already exists" };
        }

        const token = uuidv4();
        const { error } = await supabase.from("invitations").insert([{
            org_id, email, role, token, status: 'pending'
        }]);

        if (error) {
            console.error("Invite error", error);
            return { status: 500, message: "Failed to create invitation. Did you run the SQL migration?" };
        }

        return { status: 201, message: "Invitation created", token };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function acceptInvite(token, name, password) {
    try {
        // Find invite
        const { data: invite, error: inviteError } = await supabase
            .from("invitations")
            .select("*")
            .eq("token", token)
            .eq("status", "pending")
            .maybeSingle();
            
        if (inviteError || !invite) {
            return { status: 404, message: "Invalid or expired invitation" };
        }

        // Create user
        const hashedPass = await bcrypt.hash(password, 10);
        const { data: newUser, error: userError } = await supabase.from("users").insert([{
            org_id: invite.org_id,
            name,
            email: invite.email,
            password: hashedPass,
            role: invite.role
        }]).select().single();

        if (userError) {
            return { status: 500, message: "User creation failed" };
        }

        // Mark invite accepted
        await supabase.from("invitations").update({ status: "accepted" }).eq("id", invite.id);

        return { status: 201, message: "Joined organization successfully" };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function updateRole(target_user_id, org_id, new_role, inviterRole) {
    if (inviterRole !== 1) {
        return { status: 403, message: "Only administrators can change roles" };
    }
    try {
        const { error } = await supabase
            .from("users")
            .update({ role: new_role })
            .eq("user_id", target_user_id)
            .eq("org_id", org_id);

        if (error) {
            return { status: 500, message: "Failed to update role" };
        }
        return { status: 200, message: "Role updated successfully" };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}
