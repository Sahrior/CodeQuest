require("dotenv").config();
const mysql = require("mysql2/promise");

const DB_NAME = process.env.DB_NAME || "codequest";

const tables = {
    admin: `
        CREATE TABLE IF NOT EXISTS admin (
            admin_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            login_key VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    student: `
        CREATE TABLE IF NOT EXISTS student (
            student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            education_level VARCHAR(50) NULL,
            contest_rating INT NOT NULL DEFAULT 1000,
            is_premium BOOLEAN NOT NULL DEFAULT FALSE,
            premium_expires_at DATETIME NULL,
            cv_url VARCHAR(500) NULL,
            bio TEXT NULL,
            profile_pic_url VARCHAR(500) NULL,
            headline VARCHAR(150) NULL,
            phone VARCHAR(20) NULL,
            country VARCHAR(100) NULL,
            city VARCHAR(100) NULL,
            university VARCHAR(150) NULL,
            degree VARCHAR(100) NULL,
            graduation_year YEAR NULL,
            skills JSON NULL,
            preferred_languages JSON NULL,
            algorithms JSON NULL,
            tech_stack JSON NULL,
            github_url VARCHAR(255) NULL,
            linkedin_url VARCHAR(255) NULL,
            portfolio_url VARCHAR(255) NULL,
            leetcode_username VARCHAR(100) NULL,
            codeforces_handle VARCHAR(100) NULL,
            codechef_username VARCHAR(100) NULL,
            hackerrank_username VARCHAR(100) NULL,
            open_to_work BOOLEAN NOT NULL DEFAULT FALSE,
            is_profile_public BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    company: `
        CREATE TABLE IF NOT EXISTS company (
            company_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            verification_doc_url VARCHAR(500) NULL,
            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
            verified_by INT UNSIGNED NULL,
            verified_at DATETIME NULL,
            profile_pic_url VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (verified_by)
                REFERENCES admin(admin_id)
                ON DELETE SET NULL
        )
    `,

    company_profile: `
        CREATE TABLE IF NOT EXISTS company_profile (
            company_id INT UNSIGNED PRIMARY KEY,
            logo_url VARCHAR(500),
            description TEXT,
            website VARCHAR(255),
            industry VARCHAR(100),
            company_size VARCHAR(50),
            headquarters VARCHAR(150),
            founded_year YEAR,
            tech_stack VARCHAR(500),
            culture TEXT,
            benefits TEXT,
            is_public BOOLEAN NOT NULL DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (company_id)
                REFERENCES company(company_id)
                ON DELETE CASCADE
        )
    `,

    problem: `
        CREATE TABLE IF NOT EXISTS problem (
            problem_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            problem_name VARCHAR(200) NOT NULL,
            problem_rating INT NOT NULL DEFAULT 800,
            problem_tag JSON NULL,
            statement MEDIUMTEXT NOT NULL,
            input_format TEXT NOT NULL,
            output_format TEXT NOT NULL,
            constraints_text TEXT,
            time_limit_ms INT NOT NULL DEFAULT 1000,
            memory_limit_mb INT NOT NULL DEFAULT 256,
            animation_url VARCHAR(500),
            animation_algo VARCHAR(100),
            editorial MEDIUMTEXT,
            created_by INT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (created_by)
                REFERENCES admin(admin_id)
                ON DELETE SET NULL,

            INDEX idx_problem_rating (problem_rating)
        )
    `,

    test_case: `
        CREATE TABLE IF NOT EXISTS test_case (
            test_case_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            problem_id INT UNSIGNED NOT NULL,
            input_data MEDIUMTEXT NOT NULL,
            expected_output MEDIUMTEXT NOT NULL,
            is_sample BOOLEAN NOT NULL DEFAULT FALSE,

            FOREIGN KEY (problem_id)
                REFERENCES problem(problem_id)
                ON DELETE CASCADE
        )
    `,

    game: `
        CREATE TABLE IF NOT EXISTS game (
            game_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            game_name VARCHAR(150) NOT NULL,
            description TEXT,
            topic VARCHAR(100),
            problem_id INT UNSIGNED NULL,
            difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',

            FOREIGN KEY (problem_id)
                REFERENCES problem(problem_id)
                ON DELETE SET NULL
        )
    `,

    contest: `
        CREATE TABLE IF NOT EXISTS contest (
            contest_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            contest_name VARCHAR(200) NOT NULL,
            is_job_contest BOOLEAN NOT NULL DEFAULT FALSE,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            is_rated BOOLEAN NOT NULL DEFAULT TRUE,
            created_by_admin INT UNSIGNED NULL,
            created_by_company INT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (created_by_admin)
                REFERENCES admin(admin_id)
                ON DELETE SET NULL,

            FOREIGN KEY (created_by_company)
                REFERENCES company(company_id)
                ON DELETE SET NULL,

            CHECK (end_time > start_time)
        )
    `,

    contest_problem: `
        CREATE TABLE IF NOT EXISTS contest_problem (
            contest_id INT UNSIGNED NOT NULL,
            problem_id INT UNSIGNED NOT NULL,
            points INT NOT NULL DEFAULT 100,

            PRIMARY KEY (contest_id, problem_id),

            FOREIGN KEY (contest_id)
                REFERENCES contest(contest_id)
                ON DELETE CASCADE,

            FOREIGN KEY (problem_id)
                REFERENCES problem(problem_id)
                ON DELETE CASCADE
        )
    `,

    contest_participant: `
        CREATE TABLE IF NOT EXISTS contest_participant (
            contest_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            total_score INT NOT NULL DEFAULT 0,
            final_rank INT NULL,
            rating_change INT NOT NULL DEFAULT 0,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (contest_id, student_id),

            FOREIGN KEY (contest_id)
                REFERENCES contest(contest_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    job: `
        CREATE TABLE IF NOT EXISTS job (
            job_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            company_id INT UNSIGNED NOT NULL,
            job_name VARCHAR(200) NOT NULL,
            description TEXT,
            location VARCHAR(150),
            job_type ENUM('full_time', 'part_time', 'internship', 'contract') DEFAULT 'full_time',
            salary_range VARCHAR(100),
            contest_id INT UNSIGNED NULL,
            shortlist_count INT UNSIGNED NULL,
            application_deadline DATETIME NULL,
            status ENUM('open', 'closed', 'draft') NOT NULL DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (company_id)
                REFERENCES company(company_id)
                ON DELETE CASCADE,

            FOREIGN KEY (contest_id)
                REFERENCES contest(contest_id)
                ON DELETE SET NULL
        )
    `,

    job_application: `
        CREATE TABLE IF NOT EXISTS job_application (
            application_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            job_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            cv_url VARCHAR(500),
            status ENUM('applied', 'contest_pending', 'contest_completed', 'shortlisted', 'rejected', 'selected') NOT NULL DEFAULT 'applied',
            contest_rank INT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            UNIQUE KEY uq_job_student (job_id, student_id),

            FOREIGN KEY (job_id)
                REFERENCES job(job_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    submission: `
        CREATE TABLE IF NOT EXISTS submission (
            submission_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            problem_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            contest_id INT UNSIGNED NULL,
            language VARCHAR(20) NOT NULL,
            code MEDIUMTEXT NOT NULL,
            verdict ENUM('pending', 'accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compile_error') NOT NULL DEFAULT 'pending',
            runtime_ms INT NULL,
            memory_kb INT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (problem_id)
                REFERENCES problem(problem_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE,

            FOREIGN KEY (contest_id)
                REFERENCES contest(contest_id)
                ON DELETE SET NULL,

            INDEX idx_sub_student_problem (student_id, problem_id, verdict),
            INDEX idx_sub_contest (contest_id)
        )
    `,

    submission_review: `
        CREATE TABLE IF NOT EXISTS submission_review (
            review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id BIGINT UNSIGNED NOT NULL UNIQUE,
            admin_id INT UNSIGNED NULL,
            ai_score DECIMAL(5,2) NULL,
            is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
            reason TEXT,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (submission_id)
                REFERENCES submission(submission_id)
                ON DELETE CASCADE,

            FOREIGN KEY (admin_id)
                REFERENCES admin(admin_id)
                ON DELETE SET NULL
        )
    `,

    premium_purchase: `
        CREATE TABLE IF NOT EXISTS premium_purchase (
            purchase_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_ref VARCHAR(100),
            starts_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    interview: `
        CREATE TABLE IF NOT EXISTS interview (
            interview_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            admin_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            scheduled_at DATETIME NOT NULL,
            meeting_link VARCHAR(500),
            status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
            feedback TEXT,
            rating TINYINT NULL CHECK (rating BETWEEN 1 AND 10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (admin_id)
                REFERENCES admin(admin_id)
                ON DELETE RESTRICT,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE,

            INDEX idx_interview_time (admin_id, scheduled_at)
        )
    `,

    post: `
        CREATE TABLE IF NOT EXISTS post (
            post_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            content TEXT NOT NULL,
            image_url VARCHAR(500),
            status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            verified_by INT UNSIGNED NULL,
            verified_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE,

            FOREIGN KEY (verified_by)
                REFERENCES admin(admin_id)
                ON DELETE SET NULL,

            INDEX idx_post_status (status, created_at)
        )
    `,

    post_like: `
        CREATE TABLE IF NOT EXISTS post_like (
            post_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (post_id, student_id),

            FOREIGN KEY (post_id)
                REFERENCES post(post_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    post_comment: `
        CREATE TABLE IF NOT EXISTS post_comment (
            comment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            post_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (post_id)
                REFERENCES post(post_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    conversation: `
        CREATE TABLE IF NOT EXISTS conversation (
            conversation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_one_id INT UNSIGNED NOT NULL,
            student_two_id INT UNSIGNED NOT NULL,
            last_message_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            UNIQUE KEY uq_conversation_pair (student_one_id, student_two_id),
            INDEX idx_conversation_two (student_two_id),

            FOREIGN KEY (student_one_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE,

            FOREIGN KEY (student_two_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    message: `
        CREATE TABLE IF NOT EXISTS message (
            message_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT UNSIGNED NOT NULL,
            sender_id INT UNSIGNED NOT NULL,
            content VARCHAR(2000) NOT NULL,
            read_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            INDEX idx_message_conversation (conversation_id, message_id),
            INDEX idx_message_unread (conversation_id, sender_id, read_at),

            FOREIGN KEY (conversation_id)
                REFERENCES conversation(conversation_id)
                ON DELETE CASCADE,

            FOREIGN KEY (sender_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,

    student_block: `
        CREATE TABLE IF NOT EXISTS student_block (
            blocker_id INT UNSIGNED NOT NULL,
            blocked_id INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (blocker_id, blocked_id),

            FOREIGN KEY (blocker_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE,

            FOREIGN KEY (blocked_id)
                REFERENCES student(student_id)
                ON DELETE CASCADE
        )
    `,
};

const dropTrigger = `DROP TRIGGER IF EXISTS trg_interview_premium_only`;

const createTrigger = `
    CREATE TRIGGER trg_interview_premium_only
    BEFORE INSERT ON interview
    FOR EACH ROW
    BEGIN
        DECLARE v_premium BOOLEAN;
        DECLARE v_expiry DATETIME;

        SELECT is_premium, premium_expires_at INTO v_premium, v_expiry
        FROM student
        WHERE student_id = NEW.student_id;

        IF v_premium = FALSE OR (v_expiry IS NOT NULL AND v_expiry < NOW()) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Mock interview is a premium feature';
        END IF;
    END
`;

const createView = `
    CREATE OR REPLACE VIEW student_solved_problem AS
    SELECT DISTINCT student_id, problem_id
    FROM submission
    WHERE verdict = 'accepted'
`;

async function init() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`${DB_NAME} database created successfully!`);

        await connection.query(`USE ${DB_NAME}`);
        console.log(`${DB_NAME} database selected!`);

        let count = 0;
        for (const [name, sql] of Object.entries(tables)) {
            await connection.query(sql);
            count++;
            console.log(`Table ${count} (${name}) created successfully!`);
        }

        await connection.query(createView);
        console.log("View student_solved_problem created!");

        await connection.query(dropTrigger);
        await connection.query(createTrigger);
        console.log("Trigger trg_interview_premium_only created!");

        console.log("=================================");
        console.log(`All ${count} CodeQuest tables created!`);
        console.log("=================================");
    } catch (err) {
        console.log("Error while setting up the database:", err);
    } finally {
        await connection.end();
    }
}

init();