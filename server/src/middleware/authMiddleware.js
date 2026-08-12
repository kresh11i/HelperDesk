import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token invalid" })
    }
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized",
        })
    }
    const token = authHeader.split(" ")[1];
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

}