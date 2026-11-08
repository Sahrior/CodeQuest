require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
require("./config/db");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "uploads"), {
        setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    })
);

// auth rotues

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// student routes

const studentRoutes = require("./routes/student");
const studentProfileRoutes = require("./routes/studentProfile");


app.use("/api/student", studentRoutes);
app.use("/api/student", studentProfileRoutes);

app.get("/", (req, res) => {
    res.json({ message: "CodeQuest API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});