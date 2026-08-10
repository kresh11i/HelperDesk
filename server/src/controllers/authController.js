import express from "express";

export function login(req, res) {
    res.json({
        message: "login route",
    })
}

export function register(req, res) {
    res.json({
        message: "register route",
    })
}