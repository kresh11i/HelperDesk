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
        console.log(req.user);

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

}

export function authorizeRole(...allowedRoles) {
    return (req, res, next) => {

        const userRole = req.user.role;

        console.log("USER ROLE:", userRole);
        console.log("ALLOWED ROLES:", allowedRoles);

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            return res.status(403).json({
                message: "forbidden"
            });
        }
    };
}

export function requireOrganization(req, res, next) {
    if (!req.user || !req.user.org_id) {
        return res.status(403).json({
            message: "Organization membership required"
        });
    }
    next();
}