const express = require("express");
const db = require("../config/db").promise();
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

const query = (sql, params = []) => db.query(sql, params).then(([rows]) => rows);

const toNumber = (value) => Number(value) || 0;

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

const safeUrl = (value) =>
    typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;

const shiftDay = (dayString, offset) => {
    const date = new Date(`${dayString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
};

const calculateStreak = (days, today) => {
    const activeDays = new Set(days);
    let cursor = activeDays.has(today) ? today : shiftDay(today, -1);
    let streak = 0;

    while (activeDays.has(cursor)) {
        streak++;
        cursor = shiftDay(cursor, -1);
    }

    return streak;
};

const buildRatingHistory = (rows, currentRating) => {
    let running = currentRating;
    const history = [];

    for (const row of [...rows].reverse()) {
        const change = toNumber(row.rating_change);
        history.push({
            contest: row.contest_name,
            date: row.end_time,
            rating: running,
            change,
        });
        running -= change;
    }

    return history.reverse().slice(-12);
};

const buildTopics = (rows) => {
    const counts = {};

    rows.forEach((row) => {
        parseList(row.problem_tag).forEach((tag) => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
    });

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([topic, solved]) => ({ topic, solved }));
};

router.get("/home", requireAuth("Student"), async (req, res) => {
    const studentId = req.user.id;

    try {
        const profileRows = await query(
            `SELECT student_id AS id, name, email, headline, education_level, university,
                    country, city, contest_rating, profile_pic_url, open_to_work,
                    skills, tech_stack, preferred_languages, algorithms,
                    (is_premium = TRUE AND (premium_expires_at IS NULL OR premium_expires_at > NOW())) AS is_premium
             FROM student
             WHERE student_id = ?`,
            [studentId]
        );

        if (profileRows.length === 0) {
            return res.status(404).json({ message: "Account not found" });
        }

        const profile = profileRows[0];
        const rating = profile.contest_rating;

        const [
            solvedRows,
            totalRows,
            submissionRows,
            joinedRows,
            rankRows,
            studentCountRows,
            activityRows,
            weekRows,
            todayRows,
            contests,
            recommended,
            recent,
            jobs,
            leaderboard,
            ratingRows,
            solvedTagRows,
            languageRows,
        ] = await Promise.all([
            query(
                `SELECT COUNT(*) AS solved,
                        COALESCE(SUM(p.problem_rating < 1200), 0) AS easy,
                        COALESCE(SUM(p.problem_rating >= 1200 AND p.problem_rating < 1800), 0) AS medium,
                        COALESCE(SUM(p.problem_rating >= 1800), 0) AS hard
                 FROM student_solved_problem sp
                 JOIN problem p ON p.problem_id = sp.problem_id
                 WHERE sp.student_id = ?`,
                [studentId]
            ),
            query(
                `SELECT COUNT(*) AS total,
                        COALESCE(SUM(problem_rating < 1200), 0) AS easy,
                        COALESCE(SUM(problem_rating >= 1200 AND problem_rating < 1800), 0) AS medium,
                        COALESCE(SUM(problem_rating >= 1800), 0) AS hard
                 FROM problem`
            ),
            query(
                `SELECT COUNT(*) AS total,
                        COALESCE(SUM(verdict = 'accepted'), 0) AS accepted
                 FROM submission
                 WHERE student_id = ?`,
                [studentId]
            ),
            query(
                `SELECT COUNT(*) AS joined FROM contest_participant WHERE student_id = ?`,
                [studentId]
            ),
            query(
                `SELECT COUNT(*) + 1 AS position FROM student WHERE contest_rating > ?`,
                [rating]
            ),
            query(`SELECT COUNT(*) AS total FROM student`),
            query(
                `SELECT DATE_FORMAT(submitted_at, '%Y-%m-%d') AS day,
                        COUNT(*) AS count,
                        COALESCE(SUM(verdict = 'accepted'), 0) AS accepted
                 FROM submission
                 WHERE student_id = ? AND submitted_at >= CURDATE() - INTERVAL 111 DAY
                 GROUP BY DATE_FORMAT(submitted_at, '%Y-%m-%d')`,
                [studentId]
            ),
            query(
                `SELECT COUNT(DISTINCT problem_id) AS solved
                 FROM submission
                 WHERE student_id = ? AND verdict = 'accepted' AND submitted_at >= NOW() - INTERVAL 7 DAY`,
                [studentId]
            ),
            query(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today`),
            query(
                `SELECT c.contest_id, c.contest_name, c.is_job_contest, c.start_time, c.end_time,
                        (SELECT COUNT(*) FROM contest_problem cp WHERE cp.contest_id = c.contest_id) AS problem_count,
                        (SELECT COUNT(*) FROM contest_participant pt WHERE pt.contest_id = c.contest_id) AS participants,
                        EXISTS(SELECT 1 FROM contest_participant me WHERE me.contest_id = c.contest_id AND me.student_id = ?) AS registered,
                        CASE WHEN c.start_time <= NOW() THEN 'live' ELSE 'upcoming' END AS status
                 FROM contest c
                 WHERE c.end_time > NOW()
                   AND (c.is_job_contest = FALSE
                        OR c.contest_id IN (SELECT j.contest_id
                                            FROM job j
                                            JOIN job_application ja ON ja.job_id = j.job_id
                                            WHERE ja.student_id = ? AND j.contest_id IS NOT NULL))
                 ORDER BY c.start_time ASC
                 LIMIT 5`,
                [studentId, studentId]
            ),
            query(
                `SELECT p.problem_id, p.problem_name, p.problem_rating, p.problem_tag
                 FROM problem p
                 WHERE p.problem_id NOT IN (SELECT problem_id FROM student_solved_problem WHERE student_id = ?)
                 ORDER BY ABS(p.problem_rating - ?) ASC, p.problem_id ASC
                 LIMIT 5`,
                [studentId, rating]
            ),
            query(
                `SELECT s.submission_id, p.problem_name, s.verdict, s.language, s.submitted_at
                 FROM submission s
                 JOIN problem p ON p.problem_id = s.problem_id
                 WHERE s.student_id = ?
                 ORDER BY s.submitted_at DESC, s.submission_id DESC
                 LIMIT 6`,
                [studentId]
            ),
            query(
                `SELECT j.job_id, j.job_name, j.location, j.job_type, j.salary_range, j.application_deadline,
                        (j.contest_id IS NOT NULL) AS has_contest,
                        c.company_name, cp.logo_url,
                        EXISTS(SELECT 1 FROM job_application ja WHERE ja.job_id = j.job_id AND ja.student_id = ?) AS applied
                 FROM job j
                 JOIN company c ON c.company_id = j.company_id
                 LEFT JOIN company_profile cp ON cp.company_id = c.company_id
                 WHERE j.status = 'open'
                   AND c.is_verified = TRUE
                   AND (j.application_deadline IS NULL OR j.application_deadline > NOW())
                 ORDER BY j.created_at DESC, j.job_id DESC
                 LIMIT 5`,
                [studentId]
            ),
            query(
                `SELECT student_id AS id, name, country, contest_rating, profile_pic_url
                 FROM student
                 WHERE is_profile_public = TRUE
                 ORDER BY contest_rating DESC, student_id ASC
                 LIMIT 5`
            ),
            query(
                `SELECT c.contest_name, c.end_time, cp.rating_change
                 FROM contest_participant cp
                 JOIN contest c ON c.contest_id = cp.contest_id
                 WHERE cp.student_id = ? AND c.end_time <= NOW()
                 ORDER BY c.end_time ASC`,
                [studentId]
            ),
            query(
                `SELECT p.problem_tag
                 FROM student_solved_problem sp
                 JOIN problem p ON p.problem_id = sp.problem_id
                 WHERE sp.student_id = ?`,
                [studentId]
            ),
            query(
                `SELECT language, COUNT(*) AS count
                 FROM submission
                 WHERE student_id = ?
                 GROUP BY language
                 ORDER BY count DESC
                 LIMIT 6`,
                [studentId]
            ),
        ]);

        const solved = solvedRows[0];
        const totals = totalRows[0];
        const submissions = submissionRows[0];
        const today = todayRows[0].today;

        const activity = activityRows.map((row) => ({
            day: row.day,
            count: toNumber(row.count),
            accepted: toNumber(row.accepted),
        }));
        const totalSubmissions = toNumber(submissions.total);
        const acceptedSubmissions = toNumber(submissions.accepted);

        return res.json({
            today,
            profile: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                headline: profile.headline,
                education_level: profile.education_level,
                university: profile.university,
                country: profile.country,
                city: profile.city,
                contest_rating: profile.contest_rating,
                profile_pic_url: profile.profile_pic_url,
                open_to_work: Boolean(profile.open_to_work),
                is_premium: Boolean(profile.is_premium),
                skills: parseList(profile.skills),
                tech_stack: parseList(profile.tech_stack),
                preferred_languages: parseList(profile.preferred_languages),
                algorithms: parseList(profile.algorithms),
            },
            stats: {
                solved: toNumber(solved.solved),
                easy_solved: toNumber(solved.easy),
                medium_solved: toNumber(solved.medium),
                hard_solved: toNumber(solved.hard),
                total_problems: toNumber(totals.total),
                easy_total: toNumber(totals.easy),
                medium_total: toNumber(totals.medium),
                hard_total: toNumber(totals.hard),
                total_submissions: totalSubmissions,
                accepted_submissions: acceptedSubmissions,
                acceptance_rate: totalSubmissions
                    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
                    : 0,
                contests_joined: toNumber(joinedRows[0].joined),
                rank: toNumber(rankRows[0].position),
                total_students: toNumber(studentCountRows[0].total),
                streak: calculateStreak(activity.map((a) => a.day), today),
                solved_this_week: toNumber(weekRows[0].solved),
            },
            activity,
            rating_history: buildRatingHistory(ratingRows, rating),
            topics: buildTopics(solvedTagRows),
            languages: languageRows.map((row) => ({
                language: row.language,
                count: toNumber(row.count),
            })),
            upcoming_contests: contests.map((c) => ({
                contest_id: c.contest_id,
                contest_name: c.contest_name,
                is_job_contest: Boolean(c.is_job_contest),
                start_time: c.start_time,
                end_time: c.end_time,
                problem_count: toNumber(c.problem_count),
                participants: toNumber(c.participants),
                registered: Boolean(c.registered),
                status: c.status,
            })),
            recommended_problems: recommended.map((p) => ({
                problem_id: p.problem_id,
                problem_name: p.problem_name,
                problem_rating: p.problem_rating,
                tags: parseList(p.problem_tag),
            })),
            recent_submissions: recent,
            jobs: jobs.map((j) => ({
                job_id: j.job_id,
                job_name: j.job_name,
                company_name: j.company_name,
                logo_url: j.logo_url,
                location: j.location,
                job_type: j.job_type,
                salary_range: j.salary_range,
                application_deadline: j.application_deadline,
                has_contest: Boolean(j.has_contest),
                applied: Boolean(j.applied),
            })),
            leaderboard: leaderboard.map((s, index) => ({
                id: s.id,
                rank: index + 1,
                name: s.name,
                country: s.country,
                contest_rating: s.contest_rating,
                profile_pic_url: s.profile_pic_url,
            })),
        });
    } catch (err) {
        console.log("Student home error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.get("/search", requireAuth(), async (req, res) => {
    const text = String(req.query.q || "").trim().slice(0, 50);

    if (text.length < 2) {
        return res.json({ results: [] });
    }

    const escaped = text.replace(/[\\%_]/g, "\\$&");
    const like = `%${escaped}%`;
    const prefix = `${escaped}%`;

    try {
        const rows = await query(
            `SELECT student_id AS id, name, headline, university, country, contest_rating, profile_pic_url
             FROM student
             WHERE is_profile_public = TRUE
               AND (name LIKE ? OR university LIKE ? OR headline LIKE ?
                    OR leetcode_username LIKE ? OR codeforces_handle LIKE ?
                    OR CAST(skills AS CHAR) LIKE ? OR CAST(tech_stack AS CHAR) LIKE ?)
             ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, contest_rating DESC, student_id ASC
             LIMIT 8`,
            [like, like, like, like, like, like, like, prefix]
        );

        return res.json({ results: rows });
    } catch (err) {
        console.log("Student search error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

router.get("/profile/:id", requireAuth(), async (req, res) => {
    const targetId = Number(req.params.id);

    if (!Number.isInteger(targetId) || targetId <= 0) {
        return res.status(400).json({ message: "Invalid profile" });
    }

    const viewerIsStudent = req.user.role === "Student";
    const isSelf = viewerIsStudent && req.user.id === targetId;

    try {
        const rows = await query(
            `SELECT student_id AS id, name, headline, bio, education_level, university, degree,
                    graduation_year, country, city, contest_rating, profile_pic_url, open_to_work,
                    skills, tech_stack, preferred_languages, algorithms,
                    github_url, linkedin_url, portfolio_url,
                    leetcode_username, codeforces_handle, codechef_username, hackerrank_username,
                    created_at
             FROM student
             WHERE student_id = ? AND (is_profile_public = TRUE OR student_id = ?)`,
            [targetId, isSelf ? targetId : 0]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "This profile is private or does not exist" });
        }

        const profile = rows[0];
        const rating = profile.contest_rating;

        const [
            viewerRows,
            solvedRows,
            totalRows,
            submissionRows,
            joinedRows,
            rankRows,
            studentCountRows,
            ratingRows,
            solvedTagRows,
            languageRows,
        ] = await Promise.all([
            viewerIsStudent
                ? query(
                      `SELECT (is_premium = TRUE AND (premium_expires_at IS NULL OR premium_expires_at > NOW())) AS is_premium
                       FROM student WHERE student_id = ?`,
                      [req.user.id]
                  )
                : Promise.resolve([]),
            query(
                `SELECT COUNT(*) AS solved,
                        COALESCE(SUM(p.problem_rating < 1200), 0) AS easy,
                        COALESCE(SUM(p.problem_rating >= 1200 AND p.problem_rating < 1800), 0) AS medium,
                        COALESCE(SUM(p.problem_rating >= 1800), 0) AS hard
                 FROM student_solved_problem sp
                 JOIN problem p ON p.problem_id = sp.problem_id
                 WHERE sp.student_id = ?`,
                [targetId]
            ),
            query(`SELECT COUNT(*) AS total FROM problem`),
            query(
                `SELECT COUNT(*) AS total,
                        COALESCE(SUM(verdict = 'accepted'), 0) AS accepted
                 FROM submission
                 WHERE student_id = ?`,
                [targetId]
            ),
            query(
                `SELECT COUNT(*) AS joined FROM contest_participant WHERE student_id = ?`,
                [targetId]
            ),
            query(
                `SELECT COUNT(*) + 1 AS position FROM student WHERE contest_rating > ?`,
                [rating]
            ),
            query(`SELECT COUNT(*) AS total FROM student`),
            query(
                `SELECT c.contest_name, c.end_time, cp.rating_change
                 FROM contest_participant cp
                 JOIN contest c ON c.contest_id = cp.contest_id
                 WHERE cp.student_id = ? AND c.end_time <= NOW()
                 ORDER BY c.end_time ASC`,
                [targetId]
            ),
            query(
                `SELECT p.problem_tag
                 FROM student_solved_problem sp
                 JOIN problem p ON p.problem_id = sp.problem_id
                 WHERE sp.student_id = ?`,
                [targetId]
            ),
            query(
                `SELECT language, COUNT(*) AS count
                 FROM submission
                 WHERE student_id = ?
                 GROUP BY language
                 ORDER BY count DESC
                 LIMIT 6`,
                [targetId]
            ),
        ]);

        const solved = solvedRows[0];
        const submissions = submissionRows[0];
        const totalSubmissions = toNumber(submissions.total);
        const acceptedSubmissions = toNumber(submissions.accepted);

        return res.json({
            is_self: isSelf,
            viewer_is_premium: Boolean(viewerRows[0]?.is_premium),
            profile: {
                id: profile.id,
                name: profile.name,
                headline: profile.headline,
                bio: profile.bio,
                education_level: profile.education_level,
                university: profile.university,
                degree: profile.degree,
                graduation_year: profile.graduation_year,
                country: profile.country,
                city: profile.city,
                contest_rating: profile.contest_rating,
                profile_pic_url: profile.profile_pic_url,
                open_to_work: Boolean(profile.open_to_work),
                joined: profile.created_at,
                skills: parseList(profile.skills),
                tech_stack: parseList(profile.tech_stack),
                preferred_languages: parseList(profile.preferred_languages),
                algorithms: parseList(profile.algorithms),
                links: {
                    github: safeUrl(profile.github_url),
                    linkedin: safeUrl(profile.linkedin_url),
                    portfolio: safeUrl(profile.portfolio_url),
                    leetcode: profile.leetcode_username,
                    codeforces: profile.codeforces_handle,
                    codechef: profile.codechef_username,
                    hackerrank: profile.hackerrank_username,
                },
            },
            stats: {
                solved: toNumber(solved.solved),
                easy_solved: toNumber(solved.easy),
                medium_solved: toNumber(solved.medium),
                hard_solved: toNumber(solved.hard),
                total_problems: toNumber(totalRows[0].total),
                acceptance_rate: totalSubmissions
                    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
                    : 0,
                total_submissions: totalSubmissions,
                contests_joined: toNumber(joinedRows[0].joined),
                rank: toNumber(rankRows[0].position),
                total_students: toNumber(studentCountRows[0].total),
            },
            rating_history: buildRatingHistory(ratingRows, rating),
            topics: buildTopics(solvedTagRows),
            languages: languageRows.map((row) => ({
                language: row.language,
                count: toNumber(row.count),
            })),
        });
    } catch (err) {
        console.log("Student profile error:", err);
        return res.status(500).json({ message: "Something went wrong on the server" });
    }
});

module.exports = router;