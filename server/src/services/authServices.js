import { AuthWeakPasswordError } from "@supabase/supabase-js";
import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function generateToken(userData) {
    return jwt.sign({
        user_id: userData.user_id,
        org_id: userData.org_id,
        email: userData.email,
        role: userData.role,
        name: userData.name
    }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
}

export async function register(data) {
    const { name, email, password } = data;

    // Validate input
    if (!name || !email || !password) {
        return {
            status: 400,
            message: "All fields are required",
        };
    }

    // Check if user already exists
    try {
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
    if (password.length < 8) {
        return {
            status: 400,
            message: "Password must be at least 8 characters long",
        };
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // Create user without org
    try {
        const { data: newUser, error: userInsertError } = await supabase
            .from("users")
            .insert([
                {
                    org_id: null,
                    name,
                    email,
                    password: hashedPass,
                    role: null
                },
            ])
            .select();

        if (userInsertError) {
            console.error("Database userInsertError details:", userInsertError);
            return {
                status: 500,
                message: "User creation failed",
            };
        }

        return {
            status: 201,
            message: "User registered successfully",
            data: newUser,
        };
    } catch (error) {
        console.log(error);
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
    const token = generateToken(userData);
    return {
        status: 200,
        message: "Login successful",
        token: token,
    };

}