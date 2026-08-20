import { AuthWeakPasswordError } from "@supabase/supabase-js";
import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export async function register(data) {
    const { organizationName, name, email, password } = data;

    // Validate input
    if (!organizationName || !name || !email || !password) {
        return {
            status: 400,
            message: "All fields are required",
        };
    }

    // Check if user already exists
    try {
        // ✅ MODIFIED: Renamed data -> existingUsers, error -> userCheckError
        const { data: existingUsers, error: userCheckError } = await supabase
            .from("users")
            .select("email")
            .eq("email", email);

        if (userCheckError) {
            console.error("Database userCheckError details:", userCheckError);
            return {
                status: 500,
                message: "Database error",
            };
        }

        if (existingUsers.length > 0) {
            return {
                status: 400,
                message: "User already exists",
            };
        }
    } catch (error) {
        return {
            status: 500,
            message: "Internal Server Error",
        };
    }

    // Create organization
    // ✅ MODIFIED: Renamed error -> orgError
    // Find existing organization
    const { data: existingOrg, error: orgCheckError } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", organizationName)
        .maybeSingle();

    if (orgCheckError) {
        console.error("Database orgCheckError details:", orgCheckError);
        return {
            status: 500,
            message: "Organization lookup failed",
        };
    }

    // Create organization only if it doesn't exist
    let orgId;

    if (existingOrg) {
        orgId = existingOrg.id;
    } else {
        const { data: newOrg, error: orgCreateError } = await supabase
            .from("organizations")
            .insert([
                {
                    name: organizationName,
                },
            ])
            .select("id")
            .single();

        if (orgCreateError) {
            console.error("Database orgCreateError details:", orgCreateError);
            return {
                status: 500,
                message: "Organization creation failed",
            };
        }

        orgId = newOrg.id;
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // Create user
    try {
        const userRole = 3;
        // ✅ MODIFIED: Renamed data -> newUser, error -> userInsertError
        const { data: newUser, error: userInsertError } = await supabase
            .from("users")
            .insert([
                {
                    org_id: orgId,
                    name,
                    email,
                    password: hashedPass,
                    role: userRole
                },
            ])
            .select();

        // ✅ MODIFIED: Check user insertion
        if (userInsertError) {
            console.error("Database userInsertError details:", userInsertError);
            return {
                status: 500,
                message: "User creation failed",
            };
        }

        // ✅ MODIFIED: Success response
        return {
            status: 201,
            message: "User registered successfully",
            data: newUser,
        };
    } catch (error) {
        console.log(error);

        // ✅ MODIFIED: Catch block
        return {
            status: 500,
            message: "Internal Server Error",
        };
    }
}

export async function login(data) {
    const { email, password } = data;
    if (!email || !password) {
        return {
            status: 400,
            message: "All fields requried"
        }
    }
    const { data: loginUser, error: loginError } = await supabase.from("users").select("*").eq("email", email);
    if (loginError) {
        return {
            status: 500,
            message: "Database error"
        }

    }

    if (loginUser.length === 0) {
        return {
            status: 404,
            message: "User not found"
        }
    }

    const userData = loginUser[0];
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
        return {
            status: 400,
            message: "Invalid credentials"
        }
    }
    //jwt signings
    console.log(userData);
    const token = jwt.sign({
        user_id: userData.user_id,
        org_id: userData.org_id,
        email: userData.email,
        role: userData.role,
        name: userData.name
    }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    })
    return {
        status: 200,
        message: "Login successful",
        token: token,
    };

}