import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { validate as isUUID } from "uuid";
import { generateToken } from "./authServices.js";

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

export async function createOrganization(userId, organizationName) {
    try {
        const { data: currentUser, error: userLookupError } = await supabase
            .from("users")
            .select("org_id")
            .eq("user_id", userId)
            .single();

        if (userLookupError) {
            return { status: 500, message: "User lookup failed" };
        }

        if (currentUser.org_id) {
            return { status: 403, message: "User already belongs to an organization" };
        }

        const { data: existingOrg, error: orgCheckError } = await supabase
            .from("organizations")
            .select("id")
            .eq("name", organizationName)
            .maybeSingle();

        if (orgCheckError) {
            return { status: 500, message: "Organization lookup failed" };
        }

        if (existingOrg) {
            return { status: 400, message: "Organization already exists. Choose a different name." };
        }

        const { data: newOrg, error: orgCreateError } = await supabase
            .from("organizations")
            .insert([{ name: organizationName }])
            .select("id")
            .single();

        if (orgCreateError) {
            return { status: 500, message: "Organization creation failed" };
        }

        const orgId = newOrg.id;
        const userRole = 1;

        const { data: updatedUser, error: userUpdateError } = await supabase
            .from("users")
            .update({ org_id: orgId, role: userRole })
            .eq("user_id", userId)
            .select()
            .single();

        if (userUpdateError || !updatedUser) {
            return { status: 500, message: "Failed to update user organization" };
        }

        const token = generateToken(updatedUser);

        return { status: 201, message: "Organization created successfully", token };
    } catch (error) {
        console.error(error);
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function inviteUser(org_id, email, role, inviterRole) {
    if (inviterRole !== 1) {
        return { status: 403, message: "Only administrators can invite users" };
    }
    
    try {
        const { data: existingUser, error: userLookupError } = await supabase
            .from("users")
            .select("org_id")
            .eq("email", email)
            .maybeSingle();

        if (userLookupError) {
            return { status: 500, message: "User lookup failed" };
        }

        if (existingUser?.org_id === org_id) {
            return { status: 400, message: "User is already a member of this organization." };
        }

        if (existingUser?.org_id) {
            return { status: 409, message: "User already belongs to another organization." };
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

export async function acceptInvite(token, userId) {
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

        const { data: user, error: userLookupError } = await supabase
            .from("users")
            .select()
            .eq("user_id", userId)
            .single();

        if (userLookupError || !user) {
            return { status: 404, message: "User not found" };
        }

        if (user.email !== invite.email) {
            return { status: 403, message: "This invitation belongs to a different user." };
        }

        if (user.org_id === invite.org_id) {
            return { status: 400, message: "User is already a member of this organization." };
        }

        if (user.org_id) {
            return { status: 409, message: "User already belongs to another organization." };
        }

        const { data: updatedUser, error: userError } = await supabase
            .from("users")
            .update({
                org_id: invite.org_id,
                role: invite.role
            })
            .eq("user_id", userId)
            .is("org_id", null)
            .select()
            .single();

        if (userError || !updatedUser) {
            return { status: 409, message: "User already belongs to an organization." };
        }

        // Mark invite accepted
        await supabase.from("invitations").update({ status: "accepted" }).eq("id", invite.id);

        const newToken = generateToken(updatedUser);
        
        return { status: 201, message: "Joined organization successfully", token: newToken };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function updateRole(target_user_id, org_id, new_role, inviterRole) {
    if (inviterRole !== 1) {
        return { status: 403, message: "Only administrators can change roles" };
    }
    try {
        const { data, error } = await supabase
            .from("users")
            .update({ role: new_role })
            .eq("user_id", target_user_id)
            .eq("org_id", org_id)
            .select();

        if (error) {
            return { status: 500, message: "Failed to update role" };
        }
        
        if (!data || data.length === 0) {
            return { status: 404, message: "User not found or unauthorized" };
        }
        return { status: 200, message: "Role updated successfully" };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}

export async function removeMember(target_user_id, admin_user_id, org_id, adminRole) {
    if (adminRole !== 1) {
        return { status: 403, message: "Only administrators can remove members" };
    }
    
    if (target_user_id === admin_user_id) {
        return { status: 400, message: "Administrators cannot remove themselves" };
    }

    try {
        // Fetch the target user to check their role
        const { data: targetUser, error: fetchError } = await supabase
            .from("users")
            .select("role")
            .eq("user_id", target_user_id)
            .eq("org_id", org_id)
            .single();

        if (fetchError || !targetUser) {
            return { status: 404, message: "User not found in this organization" };
        }

        // Prevent Admins from removing other Admins
        if (targetUser.role === 1) {
            return { status: 403, message: "Administrators cannot remove other Administrators" };
        }

        // Unassign any tickets assigned to this user
        await supabase
            .from("tickets")
            .update({ assigned_to: null })
            .eq("assigned_to", target_user_id)
            .eq("org_id", org_id);

        // Remove user from the organization
        const { error: updateError } = await supabase
            .from("users")
            .update({ org_id: null, role: null })
            .eq("user_id", target_user_id)
            .eq("org_id", org_id);

        if (updateError) {
            return { status: 500, message: "Failed to remove member" };
        }

        return { status: 200, message: "Member removed successfully" };
    } catch (err) {
        return { status: 500, message: "Internal Server Error" };
    }
}
