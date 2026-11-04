const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db").promise();

const router = express.Router();

const isLongEnough = (password) =>
    typeof password === "string" && password.length >= 8;

const createToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res) => {
    const { role } = req.body;

    try {
        if (role === "Student") {
            const { fullName, email, education, password } = req.body;

            if (!fullName || !email || !password) {
                return res.status(400).json({ message: "Please fill in all required fields" });
            }

            if (!isLongEnough(password)) {
                return res.status(400).json({ message: "Password must be at least 8 characters" });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            await db.query(
                "INSERT INTO student (name, email, password_hash, education_level) VALUES (?, ?, ?, ?)",
                [fullName, email, passwordHash, education || null]
            );

            return res.status(201).json({ message: "Student account created" });
        }

        if (role === "Company") {
            const { companyName, website, industry, contactEmail, password } = req.body;

            if (!companyName || !contactEmail || !password) {
                return res.status(400).json({ message: "Please fill in all required fields" });
            }

            if (!isLongEnough(password)) {
                return res.status(400).json({ message: "Password must be at least 8 characters" });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const [result] = await db.query(
                "INSERT INTO company (company_name, email, password_hash) VALUES (?, ?, ?)",
                [companyName, contactEmail, passwordHash]
            );

            await db.query(
                "INSERT INTO company_profile (company_id, website, industry) VALUES (?, ?, ?)",
                [result.insertId, website || null, industry || null]
            );

            return res.status(201).json({
                message: "Company account created. An admin will verify it before you can post jobs.",
            });
        }

        return res.status(403).json({ message: "This account type cannot be created here" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        console.log("Signup error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

const loginQueries = {
    Student: "SELECT student_id AS id, name, password_hash FROM student WHERE email = ?",
    Company: "SELECT company_id AS id, company_name AS name, password_hash FROM company WHERE email = ?",
    Admin: "SELECT admin_id AS id, name, password_hash FROM admin WHERE login_key = ?",
};

router.post("/login", async (req, res) => {
    const { id, password, role } = req.body;
    const sql = loginQueries[role];

    if (typeof sql !== "string" || !id || !password) {
        return res.status(400).json({ message: "Please fill in all required fields" });
    }

    try {
        const [rows] = await db.query(sql, [id]);
        const user = rows[0];

        const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.json({
            token: createToken(user.id, role),
            user: { id: user.id, name: user.name, role },
        });
    } catch (err) {
        console.log("Login error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

module.exports = router;