const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: "http://localhost:5173" },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            if (payload.role !== "Student") {
                return next(new Error("Not allowed"));
            }

            socket.user = { id: payload.id, role: payload.role };
            return next();
        } catch (err) {
            return next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`student:${socket.user.id}`);
    });

    return io;
};