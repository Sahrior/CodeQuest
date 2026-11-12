const express = require("express");
const db = require("../config/db").promise();
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

const PAGE_SIZE = 50;
const MAX_LENGTH = 2000;
const MAX_PER_MINUTE = 30;

const query = (sql, params = []) => db.query(sql, params).then(([rows]) => rows);

const toNumber = (value) => Number(value) || 0;

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const orderedPair = (a, b) => (a < b ? [a, b] : [b, a]);

const formatMessage = (row) => ({
    message_id: row.message_id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    read_at: row.read_at,
});

const emitTo = (req, studentId, event, payload) => {
    const io = req.app.get("io");
    if (io) io.to(`student:${studentId}`).emit(event, payload);
};

const sendLog = new Map();

const sendingTooFast = (userId) => {
    const now = Date.now();
    const recent = (sendLog.get(userId) || []).filter((time) => now - time < 60000);

    if (recent.length >= MAX_PER_MINUTE) {
        sendLog.set(userId, recent);
        return true;
    }

    recent.push(now);
    sendLog.set(userId, recent);
    return false;
};

const findConversation = async (me, other) => {
    const [one, two] = orderedPair(me, other);
    const rows = await query(
        "SELECT conversation_id FROM conversation WHERE student_one_id = ? AND student_two_id = ?",
        [one, two]
    );
    return rows[0] || null;
};

const getBlockState = async (me, other) => {
    const rows = await query(
        `SELECT blocker_id FROM student_block
         WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
        [me, other, other, me]
    );

    return {
        blockedByMe: rows.some((row) => row.blocker_id === me),
        blockedMe: rows.some((row) => row.blocker_id === other),
    };
};

router.get("/conversations", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;

    try {
        const [rows, viewerRows] = await Promise.all([
            query(
                `SELECT c.conversation_id,
                        s.student_id AS other_id, s.name, s.headline, s.profile_pic_url,
                        lm.content AS last_content, lm.sender_id AS last_sender_id, lm.created_at AS last_at,
                        (SELECT COUNT(*) FROM message m
                         WHERE m.conversation_id = c.conversation_id AND m.sender_id <> ? AND m.read_at IS NULL) AS unread,
                        EXISTS(SELECT 1 FROM student_block b
                               WHERE b.blocker_id = ? AND b.blocked_id = s.student_id) AS blocked_by_me
                 FROM conversation c
                 JOIN student s ON s.student_id = IF(c.student_one_id = ?, c.student_two_id, c.student_one_id)
                 JOIN message lm ON lm.message_id = (SELECT MAX(m2.message_id) FROM message m2
                                                     WHERE m2.conversation_id = c.conversation_id)
                 WHERE c.student_one_id = ? OR c.student_two_id = ?
                 ORDER BY lm.message_id DESC
                 LIMIT 100`,
                [me, me, me, me, me]
            ),
            query(
                `SELECT (is_premium = TRUE AND (premium_expires_at IS NULL OR premium_expires_at > NOW())) AS is_premium
                 FROM student WHERE student_id = ?`,
                [me]
            ),
        ]);

        return res.json({
            viewer_is_premium: Boolean(viewerRows[0]?.is_premium),
            conversations: rows.map((row) => {
                const blockedByMe = Boolean(row.blocked_by_me);
                return {
                    conversation_id: row.conversation_id,
                    other: {
                        id: row.other_id,
                        name: row.name,
                        headline: row.headline,
                        profile_pic_url: row.profile_pic_url,
                    },
                    last_message: {
                        content: row.last_content,
                        sender_id: row.last_sender_id,
                        created_at: row.last_at,
                    },
                    unread: blockedByMe ? 0 : toNumber(row.unread),
                    blocked_by_me: blockedByMe,
                };
            }),
        });
    } catch (err) {
        console.log("Conversations error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.get("/unread-count", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;

    try {
        const rows = await query(
            `SELECT COUNT(*) AS count
             FROM message m
             JOIN conversation c ON c.conversation_id = m.conversation_id
             WHERE m.sender_id <> ?
               AND m.read_at IS NULL
               AND (c.student_one_id = ? OR c.student_two_id = ?)
               AND m.sender_id NOT IN (SELECT blocked_id FROM student_block WHERE blocker_id = ?)`,
            [me, me, me, me]
        );

        return res.json({ count: toNumber(rows[0].count) });
    } catch (err) {
        console.log("Unread count error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.get("/with/:studentId", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const other = parseId(req.params.studentId);

    if (!other || other === me) {
        return res.status(400).json({ message: "Invalid student" });
    }

    const before = parseId(req.query.before);

    try {
        const students = await query(
            `SELECT student_id AS id, name, headline, profile_pic_url, is_profile_public
             FROM student WHERE student_id = ?`,
            [other]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const student = students[0];
        const conversation = await findConversation(me, other);

        if (!conversation && !student.is_profile_public) {
            return res.status(404).json({ message: "This student is not available for messages" });
        }

        const block = await getBlockState(me, other);

        let messages = [];
        let hasMore = false;

        if (conversation) {
            const rows = await query(
                `SELECT message_id, conversation_id, sender_id, content, read_at, created_at
                 FROM message
                 WHERE conversation_id = ? ${before ? "AND message_id < ?" : ""}
                 ORDER BY message_id DESC
                 LIMIT ?`,
                before
                    ? [conversation.conversation_id, before, PAGE_SIZE + 1]
                    : [conversation.conversation_id, PAGE_SIZE + 1]
            );

            hasMore = rows.length > PAGE_SIZE;
            messages = rows.slice(0, PAGE_SIZE).reverse().map(formatMessage);
        }

        return res.json({
            student: {
                id: student.id,
                name: student.name,
                headline: student.headline,
                profile_pic_url: student.profile_pic_url,
            },
            conversation_id: conversation ? conversation.conversation_id : null,
            can_message: !block.blockedByMe && !block.blockedMe,
            blocked_by_me: block.blockedByMe,
            messages,
            has_more: hasMore,
        });
    } catch (err) {
        console.log("Load chat error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/with/:studentId", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const other = parseId(req.params.studentId);

    if (!other || other === me) {
        return res.status(400).json({ message: "Invalid student" });
    }

    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

    if (!content) {
        return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (content.length > MAX_LENGTH) {
        return res.status(400).json({ message: `Messages can be at most ${MAX_LENGTH} characters` });
    }

    if (sendingTooFast(me)) {
        return res.status(429).json({ message: "You are sending messages too fast. Please wait a moment" });
    }

    try {
        const students = await query(
            "SELECT student_id, is_profile_public FROM student WHERE student_id = ?",
            [other]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const block = await getBlockState(me, other);

        if (block.blockedByMe) {
            return res.status(403).json({ message: "You blocked this student. Unblock them to send a message" });
        }

        if (block.blockedMe) {
            return res.status(403).json({ message: "You can't send messages to this student" });
        }

        const existing = await findConversation(me, other);

        if (!existing && !students[0].is_profile_public) {
            return res.status(403).json({ message: "This student is not accepting new messages" });
        }

        const [one, two] = orderedPair(me, other);
        const [conversationResult] = await db.query(
            `INSERT INTO conversation (student_one_id, student_two_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE conversation_id = LAST_INSERT_ID(conversation_id)`,
            [one, two]
        );

        let conversationId = conversationResult.insertId;

        if (!conversationId) {
            const found = await findConversation(me, other);
            conversationId = found.conversation_id;
        }

        const [messageResult] = await db.query(
            "INSERT INTO message (conversation_id, sender_id, content) VALUES (?, ?, ?)",
            [conversationId, me, content]
        );

        await db.query("UPDATE conversation SET last_message_at = NOW() WHERE conversation_id = ?", [conversationId]);

        const rows = await query(
            `SELECT message_id, conversation_id, sender_id, content, read_at, created_at
             FROM message WHERE message_id = ?`,
            [messageResult.insertId]
        );

        const message = { ...formatMessage(rows[0]), recipient_id: other };

        emitTo(req, other, "message:new", message);
        emitTo(req, me, "message:new", message);

        return res.status(201).json({ message });
    } catch (err) {
        console.log("Send message error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/with/:studentId/read", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const other = parseId(req.params.studentId);

    if (!other || other === me) {
        return res.status(400).json({ message: "Invalid student" });
    }

    try {
        const conversation = await findConversation(me, other);

        if (!conversation) {
            return res.json({ updated: 0 });
        }

        const [result] = await db.query(
            `UPDATE message SET read_at = NOW()
             WHERE conversation_id = ? AND sender_id = ? AND read_at IS NULL`,
            [conversation.conversation_id, other]
        );

        if (result.affectedRows > 0) {
            emitTo(req, other, "messages:read", { by: me });
        }

        return res.json({ updated: result.affectedRows });
    } catch (err) {
        console.log("Mark read error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.post("/block/:studentId", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const other = parseId(req.params.studentId);

    if (!other || other === me) {
        return res.status(400).json({ message: "Invalid student" });
    }

    try {
        const students = await query("SELECT student_id FROM student WHERE student_id = ?", [other]);

        if (students.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        await db.query("INSERT IGNORE INTO student_block (blocker_id, blocked_id) VALUES (?, ?)", [me, other]);

        return res.json({ blocked_by_me: true, can_message: false });
    } catch (err) {
        console.log("Block error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.delete("/block/:studentId", requireAuth("Student"), async (req, res) => {
    const me = req.user.id;
    const other = parseId(req.params.studentId);

    if (!other || other === me) {
        return res.status(400).json({ message: "Invalid student" });
    }

    try {
        await db.query("DELETE FROM student_block WHERE blocker_id = ? AND blocked_id = ?", [me, other]);

        const block = await getBlockState(me, other);

        return res.json({ blocked_by_me: false, can_message: !block.blockedMe });
    } catch (err) {
        console.log("Unblock error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

module.exports = router;