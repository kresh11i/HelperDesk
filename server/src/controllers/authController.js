import express from "express";
import * as authServices from "../services/authServices.js";

export async function register(req, res) {
    try {
        const result = await authServices.register(req.body);
        return res.status(result.status).json(result)
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });

    }

}
export async function login(req, res) {
    try {
        const result = await authServices.login(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });

    }
}

