const jwt = require("jsonwebtoken");

module.exports = (...allowedRoles) => (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please log in to continue" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
            return res.status(403).json({ message: "You do not have access to this page" });
        }

        req.user = { id: payload.id, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Your session has expired. Please log in again" });
    }
};