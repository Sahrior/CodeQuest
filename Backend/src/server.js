require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/db");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// auth rotues

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);



app.get("/", (req, res) => {
    res.json({ message: "CodeQuest API is running" });
});

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});