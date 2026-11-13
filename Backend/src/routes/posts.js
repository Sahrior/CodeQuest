const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../config/db").promise();
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

// Set to true once the admin page can approve posts. New posts then start as "pending"
// and only appear to other students after an admin approves them.
const REQUIRE_ADMIN_APPROVAL = false;

const PAGE_SIZE = 10;
const MAX_LENGTH = 2000;
const MAX_POSTS_PER_HOUR = 10;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

const IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const query = (sql, params = []) => db.query(sql, params).then(([rows]) => rows);

const toNumber = (value) => Number(value) || 0;

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const SIGNATURES = {
    ".png": [0x89, 0x50, 0x4e, 0x47],
    ".jpg": [0xff, 0xd8, 0xff],
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

const imageDirectory = path.join(UPLOAD_ROOT, "posts");
fs.mkdirSync(imageDirectory, { recursive: true });

const imageUploader = multer({
    storage: multer.diskStorage({
        destination: imageDirectory,
        filename: (req, file, cb) =>
            cb(null, `${crypto.randomBytes(16).toString("hex")}${IMAGE_TYPES[file.mimetype]}`),
    }),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
        return cb(new Error("UNSUPPORTED_TYPE"));
    },
}).single("file");

const runUpload = (req, res, next) => {
    imageUploader(req, res, (err) => {
        if (!err) return next();

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "That image is too large. The limit is 3 MB" });
        }

        if (err.message === "UNSUPPORTED_TYPE") {
            return res.status(400).json({ message: "Please choose a JPG, PNG or WebP image" });
        }

        console.log("Post upload error:", err);
        return res.status(400).json({ message: "Upload failed" });
    });
};

const postLog = new Map();

const postingTooFast = (userId) => {
    const now = Date.now();
    const recent = (postLog.get(userId) || []).filter((time) => now - time < 3600000);

    if (recent.length >= MAX_POSTS_PER_HOUR) {
        postLog.set(userId, recent);
        return true;
    }

    recent.push(now);
    postLog.set(userId, recent);
    return false;
};

const POST_COLUMNS = `
    p.post_id, p.content, p.image_url, p.status, p.created_at,
    s.student_id AS author_id, s.name, s.headline, s.profile_pic_url,
    (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = p.post_id) AS like_count,
    EXISTS(SELECT 1 FROM post_like pl2 WHERE pl2.post_id = p.post_id AND pl2.student_id = ?) AS liked_by_me
`;

const VISIBLE_TO_ME = `
    p.status = 'approved'
    AND (s.is_profile_public = TRUE OR p.student_id = ?)
    AND p.student_id NOT IN (SELECT blocked_id FROM student_block WHERE blocker_id = ?)
    AND p.student_id NOT IN (SELECT blocker_id FROM student_block WHERE blocked_id = ?)
`;

const formatPost = (row, viewerId) => ({
    post_id: row.post_id,
    content: row.content,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    like_count: toNumber(row.like_count),
    liked_by_me: Boolean(row.liked_by_me),
    is_mine: row.author_id === viewerId,
    author: {
        id: row.author_id,
        name: row.name,
        headline: row.headline,
        profile_pic_url: row.profile_pic_url,
    },
});

const loadVisiblePost = async (me, postId) => {
    const rows = await query(
        `SELECT p.post_id
         FROM post p
         JOIN student s ON s.student_id = p.student_id
         WHERE p.post_id = ? AND ${VISIBLE_TO_ME}`,
        [postId, me, me, me]
    );

    return rows[0] || null;
};

const countLikes = async (postId) => {
    const rows = await query("SELECT COUNT(*) AS count FROM post_like WHERE post_id = ?", [postId]);
    return toNumber(rows[0].count);
};

router.get("/", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const scope = req.query.scope === "mine" ? "mine" : "all";
    const before = parseId(req.query.before);

    const where = scope === "mine" ? "p.student_id = ?" : VISIBLE_TO_ME;
    const scopeParams = scope === "mine" ? [me] : [me, me, me];

    const params = [me, ...scopeParams];
    if (before) params.push(before);
    params.push(PAGE_SIZE + 1);

    try {
        const [rows, viewerRows] = await Promise.all([
            query(
                `SELECT ${POST_COLUMNS}
                 FROM post p
                 JOIN student s ON s.student_id = p.student_id
                 WHERE ${where} ${before ? "AND p.post_id < ?" : ""}
                 ORDER BY p.post_id DESC
                 LIMIT ?`,
                params
            ),
            query(
                `SELECT student_id AS id, name, headline, profile_pic_url,
                        (is_premium = TRUE AND (premium_expires_at IS NULL OR premium_expires_at > NOW())) AS is_premium
                 FROM student WHERE student_id = ?`,
                [me]
            ),
        ]);

        const viewer = viewerRows[0];

        return res.json({
            viewer: viewer
                ? {
                      id: viewer.id,
                      name: viewer.name,
                      headline: viewer.headline,
                      profile_pic_url: viewer.profile_pic_url,
                      is_premium: Boolean(viewer.is_premium),
                  }
                : null,
            posts: rows.slice(0, PAGE_SIZE).map((row) => formatPost(row, me)),
            has_more: rows.length > PAGE_SIZE,
        });
    } catch (err) {
        console.log("Load posts error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/", requireAuth("Student"), runUpload, async (req, res) => {
    const me = req.user.id;
    const file = req.file || null;
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

    const discardFile = () => {
        if (file) fs.unlink(file.path, () => {});
    };

    if (!content && !file) {
        discardFile();
        return res.status(400).json({ message: "Write something or add a photo first" });
    }

    if (content.length > MAX_LENGTH) {
        discardFile();
        return res.status(400).json({ message: `Posts can be at most ${MAX_LENGTH} characters` });
    }

    if (file && !hasValidSignature(file.path, path.extname(file.filename))) {
        discardFile();
        return res.status(400).json({ message: "That file is not a valid image" });
    }

    if (postingTooFast(me)) {
        discardFile();
        return res.status(429).json({ message: "You are posting too often. Please try again later" });
    }

    const status = REQUIRE_ADMIN_APPROVAL ? "pending" : "approved";
    const imageUrl = file ? `/uploads/posts/${file.filename}` : null;

    try {
        const [result] = await db.query(
            "INSERT INTO post (student_id, content, image_url, status) VALUES (?, ?, ?, ?)",
            [me, content, imageUrl, status]
        );

        const rows = await query(
            `SELECT ${POST_COLUMNS}
             FROM post p
             JOIN student s ON s.student_id = p.student_id
             WHERE p.post_id = ?`,
            [me, result.insertId]
        );

        return res.status(201).json({
            message:
                status === "approved"
                    ? "Your post is live"
                    : "Your post was submitted and will appear after review",
            post: formatPost(rows[0], me),
        });
    } catch (err) {
        discardFile();
        console.log("Create post error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.delete("/:id", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const postId = parseId(req.params.id);

    if (!postId) {
        return res.status(400).json({ message: "Invalid post" });
    }

    try {
        const rows = await query("SELECT student_id, image_url FROM post WHERE post_id = ?", [postId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (rows[0].student_id !== me) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }

        await db.query("DELETE FROM post WHERE post_id = ?", [postId]);
        deleteUploadedFile(rows[0].image_url);

        return res.json({ message: "Post deleted" });
    } catch (err) {
        console.log("Delete post error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/:id/like", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const postId = parseId(req.params.id);

    if (!postId) {
        return res.status(400).json({ message: "Invalid post" });
    }

    try {
        const post = await loadVisiblePost(me, postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        await db.query("INSERT IGNORE INTO post_like (post_id, student_id) VALUES (?, ?)", [postId, me]);

        return res.json({ liked: true, like_count: await countLikes(postId) });
    } catch (err) {
        console.log("Like post error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.delete("/:id/like", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const postId = parseId(req.params.id);

    if (!postId) {
        return res.status(400).json({ message: "Invalid post" });
    }

    try {
        const post = await loadVisiblePost(me, postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        await db.query("DELETE FROM post_like WHERE post_id = ? AND student_id = ?", [postId, me]);

        return res.json({ liked: false, like_count: await countLikes(postId) });
    } catch (err) {
        console.log("Unlike post error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

module.exports = router;