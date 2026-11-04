require("dotenv").config();
const bcrypt = require("bcryptjs");

const [name, loginKey, password] = process.argv.slice(2);

if (!name || !loginKey || !password) {
    console.log('Usage: npm run seed-admin -- "Admin Name" LOGIN-KEY password');
    process.exit(1);
}

const db = require("../config/db");

bcrypt.hash(password, 10).then((hash) => {
    db.query(
        "INSERT INTO admin (name, login_key, password_hash) VALUES (?, ?, ?)",
        [name, loginKey, hash],
        (err) => {
            if (err) {
                console.log(
                    "Could not create admin:",
                    err.code === "ER_DUP_ENTRY" ? "that login key already exists" : err
                );
            } else {
                console.log(`Admin "${name}" created. Login key: ${loginKey}`);
            }

            db.end();
        }
    );
});