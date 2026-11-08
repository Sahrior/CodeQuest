const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../config/db").promise();
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

const EDUCATION_LEVELS = ["High School", "Undergraduate", "Graduate", "Self-taught"];

const IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const PDF_TYPES = {
    "application/pdf": ".pdf",
};

const query = (sql, params = []) => db.query(sql, params).then(([rows]) => rows);

const parseList = (value) => {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
};

const PROFILE_COLUMNS = `
    student_id AS id, name, email, headline, bio, phone, country, city,
    education_level, university, degree, graduation_year,
    skills, tech_stack, preferred_languages, algorithms,
    github_url, linkedin_url, portfolio_url,
    leetcode_username, codeforces_handle, codechef_username, hackerrank_username,
    open_to_work, is_profile_public, profile_pic_url, cv_url, created_at,
    (is_premium = TRUE AND (premium_expires_at IS NULL OR premium_expires_at > NOW())) AS is_premium
`;

const formatProfile = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    headline: row.headline,
    bio: row.bio,
    phone: row.phone,
    country: row.country,
    city: row.city,
    education_level: row.education_level,
    university: row.university,
    degree: row.degree,
    graduation_year: row.graduation_year,
    skills: parseList(row.skills),
    tech_stack: parseList(row.tech_stack),
    preferred_languages: parseList(row.preferred_languages),
    algorithms: parseList(row.algorithms),
    github_url: row.github_url,
    linkedin_url: row.linkedin_url,
    portfolio_url: row.portfolio_url,
    leetcode_username: row.leetcode_username,
    codeforces_handle: row.codeforces_handle,
    codechef_username: row.codechef_username,
    hackerrank_username: row.hackerrank_username,
    open_to_work: Boolean(row.open_to_work),
    is_profile_public: Boolean(row.is_profile_public),
    profile_pic_url: row.profile_pic_url,
    cv_url: row.cv_url,
    is_premium: Boolean(row.is_premium),
    joined: row.created_at,
});

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const orNull = (text) => (text === "" ? null : text);

const limitedText = (value, max, field, errors) => {
    const text = cleanText(value);
    if (text.length > max) {
        errors[field] = `Please keep this under ${max} characters`;
    }
    return orNull(text);
};

const cleanList = (value, field, errors) => {
    if (value === undefined || value === null) return [];

    if (!Array.isArray(value)) {
        errors[field] = "Invalid list";
        return [];
    }

    const seen = new Set();
    const result = [];

    for (const item of value) {
        const text = cleanText(item);
        if (!text) continue;

        if (text.length > 40) {
            errors[field] = "Each item can be at most 40 characters";
            return [];
        }

        const key = text.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            result.push(text);
        }
    }

    if (result.length > 20) {
        errors[field] = "You can add at most 20 items";
    }

    return result;
};

const cleanUrl = (value, field, errors) => {
    const text = cleanText(value);
    if (!text) return null;

    try {
        const url = new URL(text);
        if (!["http:", "https:"].includes(url.protocol) || text.length > 255) {
            throw new Error("bad url");
        }
        return text;
    } catch {
        errors[field] = "Enter a valid link starting with http:// or https://";
        return null;
    }
};

const cleanHandle = (value, field, errors) => {
    const text = cleanText(value);
    if (!text) return null;

    if (!/^[A-Za-z0-9._-]{1,100}$/.test(text)) {
        errors[field] = "Use letters, numbers, dots, dashes or underscores only";
        return null;
    }

    return text;
};

const validateProfile = (body) => {
    const errors = {};

    const name = cleanText(body.name);
    if (name.length < 2 || name.length > 100) {
        errors.name = "Name must be between 2 and 100 characters";
    }

    const phone = cleanText(body.phone);
    if (!/^[0-9+\-() ]{0,20}$/.test(phone)) {
        errors.phone = "Use digits, spaces, + - ( ) only, up to 20 characters";
    }

    const educationLevel = cleanText(body.education_level);
    if (educationLevel && !EDUCATION_LEVELS.includes(educationLevel)) {
        errors.education_level = "Choose one of the listed levels";
    }

    let graduationYear = null;
    const rawYear = cleanText(String(body.graduation_year ?? ""));
    if (rawYear) {
        const year = Number(rawYear);
        if (!Number.isInteger(year) || year < 1970 || year > 2100) {
            errors.graduation_year = "Enter a year between 1970 and 2100";
        } else {
            graduationYear = year;
        }
    }

    const values = {
        name,
        headline: limitedText(body.headline, 150, "headline", errors),
        bio: limitedText(body.bio, 1000, "bio", errors),
        phone: orNull(phone),
        country: limitedText(body.country, 100, "country", errors),
        city: limitedText(body.city, 100, "city", errors),
        education_level: orNull(educationLevel),
        university: limitedText(body.university, 150, "university", errors),
        degree: limitedText(body.degree, 100, "degree", errors),
        graduation_year: graduationYear,
        skills: cleanList(body.skills, "skills", errors),
        tech_stack: cleanList(body.tech_stack, "tech_stack", errors),
        preferred_languages: cleanList(body.preferred_languages, "preferred_languages", errors),
        algorithms: cleanList(body.algorithms, "algorithms", errors),
        github_url: cleanUrl(body.github_url, "github_url", errors),
        linkedin_url: cleanUrl(body.linkedin_url, "linkedin_url", errors),
        portfolio_url: cleanUrl(body.portfolio_url, "portfolio_url", errors),
        leetcode_username: cleanHandle(body.leetcode_username, "leetcode_username", errors),
        codeforces_handle: cleanHandle(body.codeforces_handle, "codeforces_handle", errors),
        codechef_username: cleanHandle(body.codechef_username, "codechef_username", errors),
        hackerrank_username: cleanHandle(body.hackerrank_username, "hackerrank_username", errors),
        open_to_work: body.open_to_work === true,
        is_profile_public: body.is_profile_public !== false,
    };

    return { errors, values };
};

const listOrNull = (list) => (list.length > 0 ? JSON.stringify(list) : null);

const SIGNATURES = {
    ".png": [0x89, 0x50, 0x4e, 0x47],
    ".jpg": [0xff, 0xd8, 0xff],
    ".pdf": [0x25, 0x50, 0x44, 0x46],
};

const hasValidSignature = (filePath, extension) => {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (extension === ".webp") {
        return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    }

    return SIGNATURES[extension].every((byte, index) => buffer[index] === byte);
};

const deleteUploadedFile = (urlPath) => {
    if (typeof urlPath !== "string" || !urlPath.startsWith("/uploads/")) return;

    const target = path.join(UPLOAD_ROOT, urlPath.slice("/uploads/".length));
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) return;

    fs.unlink(target, () => {});
};

const makeUploader = (folder, typeMap, maxBytes) => {
    const directory = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(directory, { recursive: true });

    return multer({
        storage: multer.diskStorage({
            destination: directory,
            filename: (req, file, cb) =>
                cb(null, `${crypto.randomBytes(16).toString("hex")}${typeMap[file.mimetype]}`),
        }),
        limits: { fileSize: maxBytes, files: 1 },
        fileFilter: (req, file, cb) => {
            if (typeMap[file.mimetype]) return cb(null, true);
            return cb(new Error("UNSUPPORTED_TYPE"));
        },
    }).single("file");
};

const runUpload = (uploader) => (req, res, next) => {
    uploader(req, res, (err) => {
        if (!err) return next();

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "That file is too large" });
        }

        if (err.message === "UNSUPPORTED_TYPE") {
            return res.status(400).json({ message: "That file type is not supported" });
        }

        console.log("Upload error:", err);
        return res.status(400).json({ message: "Upload failed" });
    });
};

const avatarUploader = makeUploader("avatars", IMAGE_TYPES, 2 * 1024 * 1024);
const cvUploader = makeUploader("cvs", PDF_TYPES, 5 * 1024 * 1024);

router.get("/me/profile", requireAuth("Student"), async (req, res) => {
    try {
        const rows = await query(
            `SELECT ${PROFILE_COLUMNS} FROM student WHERE student_id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Account not found" });
        }

        return res.json({ profile: formatProfile(rows[0]) });
    } catch (err) {
        console.log("Load profile error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.put("/me/profile", requireAuth("Student"), async (req, res) => {
    const { errors, values } = validateProfile(req.body || {});

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    try {
        await db.query(
            `UPDATE student SET
                name = ?, headline = ?, bio = ?, phone = ?, country = ?, city = ?,
                education_level = ?, university = ?, degree = ?, graduation_year = ?,
                skills = ?, tech_stack = ?, preferred_languages = ?, algorithms = ?,
                github_url = ?, linkedin_url = ?, portfolio_url = ?,
                leetcode_username = ?, codeforces_handle = ?, codechef_username = ?, hackerrank_username = ?,
                open_to_work = ?, is_profile_public = ?
             WHERE student_id = ?`,
            [
                values.name, values.headline, values.bio, values.phone, values.country, values.city,
                values.education_level, values.university, values.degree, values.graduation_year,
                listOrNull(values.skills), listOrNull(values.tech_stack),
                listOrNull(values.preferred_languages), listOrNull(values.algorithms),
                values.github_url, values.linkedin_url, values.portfolio_url,
                values.leetcode_username, values.codeforces_handle,
                values.codechef_username, values.hackerrank_username,
                values.open_to_work, values.is_profile_public,
                req.user.id,
            ]
        );

        const rows = await query(
            `SELECT ${PROFILE_COLUMNS} FROM student WHERE student_id = ?`,
            [req.user.id]
        );

        return res.json({ message: "Profile updated", profile: formatProfile(rows[0]) });
    } catch (err) {
        console.log("Update profile error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/me/avatar", requireAuth("Student"), runUpload(avatarUploader), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file received" });
    }

    const extension = path.extname(req.file.filename);

    if (!hasValidSignature(req.file.path, extension)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: "That file is not a valid image" });
    }

    const url = `/uploads/avatars/${req.file.filename}`;

    try {
        const rows = await query("SELECT profile_pic_url FROM student WHERE student_id = ?", [req.user.id]);
        await db.query("UPDATE student SET profile_pic_url = ? WHERE student_id = ?", [url, req.user.id]);
        deleteUploadedFile(rows[0]?.profile_pic_url);

        return res.json({ message: "Photo updated", profile_pic_url: url });
    } catch (err) {
        fs.unlink(req.file.path, () => {});
        console.log("Avatar upload error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.delete("/me/avatar", requireAuth("Student"), async (req, res) => {
    try {
        const rows = await query("SELECT profile_pic_url FROM student WHERE student_id = ?", [req.user.id]);
        await db.query("UPDATE student SET profile_pic_url = NULL WHERE student_id = ?", [req.user.id]);
        deleteUploadedFile(rows[0]?.profile_pic_url);

        return res.json({ message: "Photo removed", profile_pic_url: null });
    } catch (err) {
        console.log("Avatar delete error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/me/cv", requireAuth("Student"), runUpload(cvUploader), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file received" });
    }

    if (!hasValidSignature(req.file.path, ".pdf")) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: "That file is not a valid PDF" });
    }

    const url = `/uploads/cvs/${req.file.filename}`;

    try {
        const rows = await query("SELECT cv_url FROM student WHERE student_id = ?", [req.user.id]);
        await db.query("UPDATE student SET cv_url = ? WHERE student_id = ?", [url, req.user.id]);
        deleteUploadedFile(rows[0]?.cv_url);

        return res.json({ message: "Resume uploaded", cv_url: url });
    } catch (err) {
        fs.unlink(req.file.path, () => {});
        console.log("CV upload error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.delete("/me/cv", requireAuth("Student"), async (req, res) => {
    try {
        const rows = await query("SELECT cv_url FROM student WHERE student_id = ?", [req.user.id]);
        await db.query("UPDATE student SET cv_url = NULL WHERE student_id = ?", [req.user.id]);
        deleteUploadedFile(rows[0]?.cv_url);

        return res.json({ message: "Resume removed", cv_url: null });
    } catch (err) {
        console.log("CV delete error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.put("/me/password", requireAuth("Student"), async (req, res) => {
    const { current_password: current, new_password: next } = req.body || {};

    if (typeof current !== "string" || typeof next !== "string" || !current || !next) {
        return res.status(400).json({ message: "Please fill in all password fields" });
    }

    if (next.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    if (next === current) {
        return res.status(400).json({ message: "New password must be different from the current one" });
    }

    try {
        const rows = await query("SELECT password_hash FROM student WHERE student_id = ?", [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Account not found" });
        }

        const matches = await bcrypt.compare(current, rows[0].password_hash);

        if (!matches) {
            return res.status(400).json({ message: "Your current password is incorrect" });
        }

        const hash = await bcrypt.hash(next, 10);
        await db.query("UPDATE student SET password_hash = ? WHERE student_id = ?", [hash, req.user.id]);

        return res.json({ message: "Password updated" });
    } catch (err) {
        console.log("Password change error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

module.exports = router;