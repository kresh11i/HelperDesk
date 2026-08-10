import express from "express";

export function healthChecker(req,res){
    res.json({
        message:"HelpDesk API is running Client connected",
    })
}
