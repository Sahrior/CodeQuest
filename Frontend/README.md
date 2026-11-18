# CodeQuest

**Code. Compete. Get hired.**

CodeQuest is an online platform where students practise coding, play algorithm games, post and chat with each other, and apply to jobs posted by companies. Admins verify companies and posts and run the platform.

> Status: the student side is the most complete. Company pages, admin pages and the practice / compete / apply / interview pages are still being built. See [Roadmap](#14-roadmap).

---

## Table of contents

1. [What is built](#1-what-is-built)
2. [Tech stack](#2-tech-stack)
3. [Getting started](#3-getting-started)
4. [Folder structure](#4-folder-structure)
5. [Database overview](#5-database-overview)
6. [API overview](#6-api-overview)
7. [How passwords and login work (bcrypt and JWT)](#7-how-passwords-and-login-work-bcrypt-and-jwt)
8. [How file uploads work (multer)](#8-how-file-uploads-work-multer)
9. [How real-time messaging works (Socket.IO)](#9-how-real-time-messaging-works-socketio)
10. [How the C++ interpreter works](#10-how-the-c-interpreter-works)
11. [How the Space Defender game works](#11-how-the-space-defender-game-works)
12. [Security notes](#12-security-notes)
13. [Troubleshooting](#13-troubleshooting)
14. [Roadmap](#14-roadmap)

---

## 1. What is built

| Area | What works today |
| --- | --- |
| Accounts | Student and company signup, login for students, companies and admins, role based redirects, protected pages |
| Student home | Dashboard with rating, rank, streak, charts (rating history, difficulty, activity, topics, languages), contests, recommended problems, recent submissions, latest jobs, top students |
| Profiles | Public student profile page, student search, full edit profile page (photo, CV, skills, links, privacy, password change) |
| Messages | One-to-one chat between students, live delivery, unread badge, read receipts, blocking |
| Posts | Write posts with an optional photo, see everyone's posts, like and unlike, delete your own posts |
| Games | Games list page and Game 1 (Space Defender) with an in-browser C++ interpreter |

Planned: practice problems, contests, jobs and applications, mock interviews, company pages, admin pages, comments on posts. The database tables for most of these already exist.

---

## 2. Tech stack

**Backend**

- Node.js with Express 5
- MySQL or MariaDB through `mysql2`
- `bcryptjs` for password hashing
- `jsonwebtoken` for login tokens (JWT)
- `multer` for file uploads
- `socket.io` for live messages
- `dotenv`, `cors`, `nodemon`

**Frontend**

- React with Vite
- React Router
- Tailwind CSS
- Recharts for the graphs
- `socket.io-client`

---

## 3. Getting started

### 3.1 Prerequisites

- **Node.js 18 or newer** (the project was built with a recent Node version)
- **MySQL 8 or MariaDB** running on your computer. XAMPP with phpMyAdmin works well.
- **Git**

### 3.2 Get the code

```bash
git clone <your-repository-url>
cd CodeQuest
```

The project has two folders that run separately: `Backend` and `Frontend`.

### 3.3 Set up the backend

```bash
cd Backend
npm install
```

Create a file named `.env` inside `Backend` (never commit this file):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=codequest
PORT=5000
JWT_SECRET=paste_a_long_random_text_here
```

Generate a good `JWT_SECRET` with this command and paste the output into `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Make sure MySQL is running, then create the database and all tables:

```bash
npm run init-db
```

You should see "codequest database created successfully!", then every table being created, then the view and trigger lines. It is safe to run again later, because every table uses `CREATE TABLE IF NOT EXISTS`.

Create your first admin account (the last value is the password):

```bash
npm run seed-admin -- "Your Name" ADMIN-001 yourStrongPassword
```

Start the backend:

```bash
npm run dev
```

You should see:

```
Server running on http://localhost:5000
CodeQuest database connected successfully!
```

> **Database connection settings:** `src/config/db.js` connects with fixed settings (host `localhost`, user `root`, empty password, database `codequest`, port `3306`). If your MySQL uses a different user or password, edit that file. The `init-db` script reads the `.env` file instead.

### 3.4 Set up the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the address Vite prints, normally **http://localhost:5173**.

The frontend talks to the backend through one setting in `Frontend/src/api.js`:

```js
export const API_URL = "http://localhost:5000";
```

The backend only accepts requests from `http://localhost:5173` (see `server.js` and `socket.js`). If you change the frontend port, change it in both backend files too.

### 3.5 Optional: sample data

If you keep the sample SQL files in your repository, run them in phpMyAdmin (database `codequest`, **SQL** tab) in this order:

1. `sample_students.sql` adds 50 students. They can not log in, because their passwords are random.
2. Sign up a new student on the website. This is the account you will log in with.
3. `sample_home_data.sql` adds companies, problems, contests, jobs and submissions (it also gives data to the account you just made).
4. `sample_posts.sql` adds 14 posts with likes.

Run each file only once. Running one twice duplicates its data.

### 3.6 First login

| Role | How to create it | How to log in |
| --- | --- | --- |
| Student | Sign up on the website | Email and password, Student tab |
| Company | Sign up on the website | Work email and password, Company tab |
| Admin | `npm run seed-admin` (admins can not sign up on the website) | Admin ID and password, Admin tab |

After login each role is sent to its own home page: `/student`, `/company` or `/admin`.

### 3.7 Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| Backend | `npm run dev` | Starts the server and restarts it when you save a file |
| Backend | `npm run init-db` | Creates the database, tables, view and trigger |
| Backend | `npm run seed-admin -- "Name" KEY password` | Creates an admin account |
| Frontend | `npm run dev` | Starts the website in development mode |
| Frontend | `npm run build` | Builds the website for production |
| Frontend | `npm run lint` | Checks the code style |

---

## 4. Folder structure

### Backend

```
Backend
├── .env                        Secrets and settings (not committed)
├── package.json
├── uploads/                    Uploaded files, created automatically (not committed)
│   ├── avatars/                Profile photos
│   ├── cvs/                    Resumes (PDF)
│   └── posts/                  Photos attached to posts
└── src
    ├── server.js               Starts Express and Socket.IO and loads all routes
    ├── socket.js               Live connection: checks the login token, joins rooms
    ├── config
    │   └── db.js               Database connection
    ├── database
    │   ├── init.js             Creates the database and every table
    │   └── seedAdmin.js        Creates an admin account from the command line
    ├── middleware
    │   └── authMiddleware.js   Checks the login token and the user role
    └── routes
        ├── auth.js             Signup and login
        ├── student.js          Home dashboard, search, public profile
        ├── studentProfile.js   Edit profile, photo and CV upload, password change
        ├── messages.js         Chats, unread count, read receipts, blocking
        └── posts.js            Posts, post photos, likes
```

### Frontend

```
Frontend
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
└── src
    ├── main.jsx                Starts React and the router
    ├── App.jsx                 All page routes
    ├── api.js                  The backend address (API_URL)
    ├── socketclient.js         One live connection per logged-in student
    ├── index.css / App.css     Global styles
    ├── assets                  Images such as the logo
    ├── components              Shared pieces: Navbar, Footer, Field, ProtectedRoute
    ├── pages                   Public pages: Landing, Login, Signup
    ├── Admin
    │   ├── Admin_Pages         AdminHome.jsx
    │   └── Admin_Components
    ├── Company
    │   ├── Company_Pages       CompanyHome.jsx
    │   └── Company_Components
    └── Student
        ├── Student_Components
        │   ├── StudentNavbar.jsx           Navbar for normal students
        │   ├── StudentNavbarPreminum.jsx   Navbar for premium students
        │   ├── StudentNav.jsx              Picks the right navbar by itself
        │   ├── StudentSearch.jsx           Search bar for finding students
        │   ├── MessagesButton.jsx          Message icon with the unread badge
        │   ├── useUnreadCount.js           Keeps the unread number up to date
        │   ├── shared.jsx                  Avatar, Card, tags, rank colours
        │   └── game                        Everything the games need
        │       ├── cppInterpreter.js       The C++ interpreter
        │       ├── game1Logic.js           Levels, starter code, judging
        │       ├── spaceBattleEngine.js    Canvas animation
        │       ├── SpaceBattle.jsx         React wrapper for the canvas
        │       ├── CodeEditor.jsx          Code editor with colours
        │       └── codeHighlight.js        Splits code into coloured pieces
        └── Student_Pages
            ├── StudentHome.jsx             Dashboard
            ├── StudentProfile.jsx          Public profile of any student
            ├── Edit_profile.jsx            Edit your own profile
            ├── Messages.jsx                Chats
            ├── Post.jsx                    Posts feed
            ├── Games.jsx                   List of games
            ├── Game1.jsx                   Space Defender
            └── Apply / Compete / Interview / Practice / Play_and_learn / Game2 / Game3
                                            Placeholders for upcoming features
```

---

## 5. Database overview

The database is called `codequest`. `npm run init-db` creates **22 tables**, one view and one trigger.

| Group | Tables | Purpose |
| --- | --- | --- |
| Users | `student`, `company`, `company_profile`, `admin` | Accounts and profile information. Passwords are stored as hashes |
| Practice | `problem`, `test_case`, `game` | Problems (with tags stored as a JSON list), judge data, games |
| Contests | `contest`, `contest_problem`, `contest_participant` | Public contests and hiring contests, scores, ranks, rating changes |
| Jobs | `job`, `job_application` | Jobs posted by companies and student applications |
| Code checking | `submission`, `submission_review` | Submitted code and the admin's AI-generated-code flag |
| Premium | `premium_purchase`, `interview` | Premium purchases and mock interviews with admins |
| Social | `post`, `post_like`, `post_comment` | Posts, likes and comments |
| Messaging | `conversation`, `message`, `student_block` | Chats between two students, messages, blocked students |

Extras created by `init.js`:

- The view `student_solved_problem` lists which problems each student solved (it is built from accepted submissions, so it never goes out of date).
- The trigger `trg_interview_premium_only` refuses to book a mock interview for a student who is not premium.

Important design choices:

- Lists such as skills, tech stack and problem tags are stored in **JSON columns** instead of separate tables.
- Files are never stored in the database. Only their links are (for example `/uploads/avatars/abc.png`).
- Every foreign key is set to delete or clear related rows in a safe way, for example deleting a student also deletes their posts and messages.

---

## 6. API overview

All routes except signup and login need a login token in the header `Authorization: Bearer <token>`.

**Auth**

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a student or company account |
| POST | `/api/auth/login` | Log in as Student, Company or Admin |

**Student**

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/student/home` | Everything the dashboard shows |
| GET | `/api/student/search?q=` | Search public profiles by name, university, skill or coding handle |
| GET | `/api/student/profile/:id` | Public profile of one student |
| GET / PUT | `/api/student/me/profile` | Load and save your own profile |
| POST / DELETE | `/api/student/me/avatar` | Upload or remove your photo |
| POST / DELETE | `/api/student/me/cv` | Upload or remove your resume |
| PUT | `/api/student/me/password` | Change your password |

**Messages**

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/messages/conversations` | Your chat list |
| GET | `/api/messages/unread-count` | Number for the navbar badge |
| GET | `/api/messages/with/:studentId` | Open a chat (add `?before=<id>` for older messages) |
| POST | `/api/messages/with/:studentId` | Send a message |
| POST | `/api/messages/with/:studentId/read` | Mark their messages as read |
| POST / DELETE | `/api/messages/block/:studentId` | Block or unblock |

**Posts**

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/posts?scope=all` or `mine` | The feed (add `&before=<id>` for the next page) |
| POST | `/api/posts` | Create a post (text and an optional photo) |
| DELETE | `/api/posts/:id` | Delete your own post |
| POST / DELETE | `/api/posts/:id/like` | Like or unlike |

**Live events (Socket.IO)**

| Event | Sent to | Meaning |
| --- | --- | --- |
| `message:new` | Sender and receiver | A message was saved |
| `messages:read` | The original sender | Your messages were read |

---

## 7. How passwords and login work (bcrypt and JWT)

### Why not store passwords directly?

If a database leaks, every password would leak with it. So CodeQuest never stores a password. It stores a **hash**, which is a one-way scrambled version. You can turn a password into a hash, but you can not turn a hash back into the password.

### What bcrypt does

The project uses `bcryptjs`. Bcrypt has three features that make it good for passwords:

1. **Salt.** Bcrypt adds a random value (the salt) to every password before hashing. Two students with the same password get completely different hashes, so an attacker can not use ready-made lists of hashes.
2. **Slowness on purpose.** Bcrypt repeats its work many times. The number `10` in `bcrypt.hash(password, 10)` is the cost: it means 2^10 = 1024 rounds. That is fast enough for one login but very slow for someone trying millions of guesses.
3. **Everything in one string.** The result carries its own settings, so checking later needs no extra information:

```
$2b$10$N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
 │   │  └─ 22 characters: the salt  └─ 31 characters: the hash
 │   └─ cost (10)
 └─ bcrypt version
```

The whole value is 60 characters long, so the `password_hash` columns are `VARCHAR(255)`, which is more than enough.

### Where it is used

**Signup** (`routes/auth.js`):

```js
const passwordHash = await bcrypt.hash(password, 10);

await db.query(
    "INSERT INTO student (name, email, password_hash, education_level) VALUES (?, ?, ?, ?)",
    [fullName, email, passwordHash, education || null]
);
```

**Login** (`routes/auth.js`):

```js
const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
}
```

`bcrypt.compare` reads the salt and cost out of the stored hash, hashes the typed password the same way, and compares the two results. It never needs the original password.

Other places that use bcrypt:

- `routes/studentProfile.js` checks the current password and hashes the new one when a student changes their password.
- `database/seedAdmin.js` hashes the admin password before saving it.

Good habits built into the code:

- A wrong email and a wrong password give the **same** message ("Invalid credentials"), so nobody can find out which emails exist.
- Passwords must be at least 8 characters.
- The password is never sent back to the browser or written to a log.

### Login tokens (JWT)

After a correct login the server creates a **JSON Web Token**:

```js
jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" })
```

The token contains the user's id and role, plus a signature made with `JWT_SECRET`. Nobody can change the contents without breaking the signature. The website keeps the token in `localStorage` and sends it with every request.

`middleware/authMiddleware.js` then does two things for each protected route:

1. Checks the signature and the expiry date.
2. Checks that the role is allowed, for example `requireAuth("Student")` rejects companies and admins.

The user id comes from the token, never from the request body, so a student can not act as another student.

```
Browser                                Server
   │  POST /api/auth/login               │
   │  { role, id, password }  ─────────► │  find user → bcrypt.compare
   │                                     │  correct → create JWT
   │  ◄───────────────  { token, user }  │
   │                                     │
   │  GET /api/student/home              │
   │  Authorization: Bearer <token> ───► │  authMiddleware verifies token + role
   │  ◄───────────────────  dashboard    │
```

On the website, `ProtectedRoute` also checks the saved role before showing a page, but this is only for convenience. The real protection is always the check on the server.

---

## 8. How file uploads work (multer)

### The problem multer solves

Normal forms send text as JSON, and `express.json()` reads it. A file is different: the browser sends it as `multipart/form-data`, which `express.json()` can not read. **Multer** is middleware that understands that format. It receives the file, saves it to disk and gives your route two things:

- `req.file`: information about the saved file (its name, path, size, type)
- `req.body`: the normal text fields that came with the form

### Where CodeQuest uses it

| Feature | Route | Folder | Allowed types | Size limit |
| --- | --- | --- | --- | --- |
| Profile photo | `POST /api/student/me/avatar` | `uploads/avatars` | JPG, PNG, WebP | 2 MB |
| Resume | `POST /api/student/me/cv` | `uploads/cvs` | PDF | 5 MB |
| Post photo | `POST /api/posts` | `uploads/posts` | JPG, PNG, WebP | 3 MB |

### How an uploader is built

```js
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
```

Piece by piece:

- **`diskStorage`** saves the file in a folder on your computer (`Backend/uploads/...`). The folder is created automatically.
- **Random file names.** The saved name is 32 random letters and digits plus an extension, for example `9f2c7a...e1.png`. The student's own file name is never used, so nobody can overwrite another file or sneak in a path like `../../server.js`, and nobody can guess another person's file link.
- **The extension comes from the file type** that was checked, not from what the student typed.
- **`limits`** refuses files that are too large and accepts only one file per request.
- **`fileFilter`** rejects any file whose type is not on the allowed list.
- **`.single("file")`** means the request must contain exactly one file in a field called `file`.

A small wrapper (`runUpload`) turns multer's errors into friendly messages such as "That file is too large".

### A second check: the file's real contents

A file's type claimed by the browser can be faked. So after multer saves the file, the route reads its first bytes and compares them with the real signature of that format:

| Format | First bytes |
| --- | --- |
| PNG | `89 50 4E 47` |
| JPEG | `FF D8 FF` |
| WebP | `RIFF` ... `WEBP` |
| PDF | `%PDF` |

If they do not match, the file is deleted and the request is refused.

### The full journey of a profile photo

```
1. Student picks a photo on the Edit profile page
2. Browser checks type and size, then sends it as FormData (field name "file")
3. authMiddleware checks the login token
4. multer saves the file to uploads/avatars/<random-name>.png
5. The route checks the file's real signature
6. The route saves the link /uploads/avatars/<random-name>.png in student.profile_pic_url
7. The route deletes the student's previous photo from disk
8. The browser receives the new link and shows the photo
```

### How files are shown

`server.js` publishes the folder with `express.static`:

```js
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), {
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));
```

The database stores only the short link (`/uploads/avatars/abc.png`). On the website, `assetUrl()` in `shared.jsx` adds the backend address in front, because the website and the backend run on different ports.

### Good to know

- The `uploads` folder is in `.gitignore`. Files are saved on the server's disk, which is fine for development. A live website should move them to cloud storage.
- Resume links are long and random, so they can not be guessed, but anyone who has the link can open the file. Later they should only be visible to companies the student applied to.

---

## 9. How real-time messaging works (Socket.IO)

Messages use two things together:

- **MySQL** keeps every message safely (the mailbox).
- **Socket.IO** pushes new messages to the other person's screen instantly (the doorbell).

When a student logs in, `socketclient.js` opens one live connection and sends the login token. `socket.js` checks the token and puts the student in a private room called `student:<id>`.

Sending a message:

1. The website sends the text to `POST /api/messages/with/:studentId`.
2. The server checks the rules: not empty, at most 2000 characters, not too fast (30 per minute), nobody blocked anybody, and the receiver has a public profile (unless a chat already exists).
3. The server saves the message and then sends a `message:new` event to the room of the sender and the room of the receiver.
4. The receiver's page shows the message at once. If the receiver is offline, nothing is lost, because the message is already in the database.

Opening a chat marks the messages as read, and the sender's page then shows "Seen". Blocking a student stops all messages in both directions and hides their unread count.

Sending goes through a normal request, not through the live connection, so all the rules live in one place.

---

## 10. How the C++ interpreter works

> This is the most unusual part of the project, so it is explained in detail.

### 10.1 What it is, and why it exists

In the games, a student writes C++ code and presses **Submit**. The code has to run and produce an answer. There are three ways to do that:

1. Compile it with a real C++ compiler on the server. This needs `g++` installed and means running strangers' code on your computer, which is dangerous.
2. Use a separate paid or self-hosted judge service.
3. **Write a small C++ interpreter that runs inside the browser.** This is what CodeQuest does.

A **compiler** turns code into a separate program. An **interpreter** reads the code and does what it says, one step at a time. The CodeQuest interpreter understands the beginner part of C++ (variables, `if / else`, loops, `cin`, `cout`), which is exactly what the first games need. It runs entirely in the student's browser. It never touches your server, your files or your database.

All of it lives in one file: `Frontend/src/Student/Student_Components/game/cppInterpreter.js`.

### 10.2 The big picture

```
Student's C++ text
        │
        ▼
 ┌─────────────┐   list of    ┌─────────────┐   syntax tree   ┌──────────────┐
 │  1. LEXER   │ ───────────► │  2. PARSER  │ ──────────────► │ 3. EXECUTOR  │
 │ cuts text   │   tokens     │ checks the  │   (the program  │ runs the tree│
 │ into pieces │              │ grammar     │    as data)     │ step by step │
 └─────────────┘              └─────────────┘                 └──────────────┘
                                    │                                 │
                              compile errors                   prints / reads input
                              (with line number)               runtime errors
```

The public part of the file is just two functions:

```js
compile(source)          // lexer + parser. Returns { ok: true, program } or { ok: false, error }
createSession(program)   // creates a running program that can be fed input turn by turn
```

### 10.3 What C++ is supported

| Feature | Supported |
| --- | --- |
| Program shape | `#include` lines (ignored), `using namespace std;`, one `int main() { ... }` |
| Types | `int`, `long`, `long long`, `double`, `float`, `bool`, `string` |
| Declarations | `int a;`, `int a = 5;`, `int a = 1, b = 2;` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `x++`, `x--`, `++x`, `--x` |
| Conditions | `if`, `else if`, `else` |
| Loops | `while`, `for`, `break`, `continue` |
| Input and output | `cin >> a >> b;`, `cin.ignore();`, `cout << ... << endl;` |
| Operators | `+ - * / %`, `< > <= >= == !=`, `&& \|\| !`, unary `-`, ternary `? :`, parentheses |
| Functions | `min(a, b)`, `max(a, b)`, `abs(x)` |
| Extras | `std::cout`, `std::string` (the `std::` is simply ignored), `// comments`, `/* comments */` |

Not supported yet (the student sees a clear message): arrays, `char`, vectors, maps, your own functions, classes, structs, `switch`, `do ... while`, pointers.

### 10.4 Stage 1: the lexer (cutting text into tokens)

The computer sees code as one long string of letters. The lexer, `tokenize(source)`, walks through it one character at a time and groups the characters into **tokens**, the smallest meaningful pieces.

The line `cout << d1 << endl;` becomes:

| Token | Type |
| --- | --- |
| `cout` | id (a word) |
| `<<` | op (an operator) |
| `d1` | id |
| `<<` | op |
| `endl` | id |
| `;` | op |

Token types:

- `id`: a word such as `int`, `if`, `d1`, `cout`
- `num`: a number. It remembers if it had a decimal point (`isFloat`), so `7` and `7.0` are different types
- `str`: text in quotes (`"hello"`). Character literals like `'a'` are treated the same way
- `op`: an operator or punctuation such as `+`, `<=`, `{`, `;`
- `eof`: a marker for the end of the text

What the lexer does along the way:

- **Skips** spaces, tabs, `// comments`, `/* comments */` and any line starting with `#` (the `#include` lines).
- **Counts lines**, so every token knows its line number. This is how error messages can say "on line 9".
- **Reads two-character operators first.** It checks for `<<`, `>>`, `<=`, `>=`, `==`, `!=`, `&&`, `||`, `++`, `--`, `+=`, `-=`, `*=`, `/=`, `%=` before the single characters. Otherwise `<=` would wrongly be read as `<` and `=`.
- **Handles `std::`.** When it reads the word `std` followed by `::`, it simply skips both, so `std::cout` becomes `cout`.
- **Understands escapes** in strings: `\n` (new line), `\t` (tab), `\"` and `\\`.
- **Rejects** unknown characters with `stray '@' in program`, and strings or comments that never close.

### 10.5 Stage 2: the parser (understanding the grammar)

Tokens are only a flat list. The parser, a class called `Parser`, turns them into a **tree** that shows how the pieces belong together. It is a *recursive descent parser*: there is one small function for each kind of thing in the language, and the functions call each other.

#### Statements

`parseStatement()` looks at the first token and decides what kind of statement it is:

| First token | What the parser does |
| --- | --- |
| `{` | `parseBlock()`: a list of statements |
| `if` | `parseIf()` |
| `while` | `parseWhile()` |
| `for` | `parseFor()` |
| `cin` | `parseCin()` |
| `cout` | `parseCout()` |
| `int`, `double`, `bool`, `string`, ... | `parseDeclaration()` |
| `break`, `continue`, `return` | simple statements |
| a variable name | `parseSimple()`: an assignment or `x++` |

#### Expressions and operator order

In maths, `1 + 2 * 3` is 7, not 9, because multiplication goes first. The parser gets this right by having **one function per level of priority**, from the weakest to the strongest operator. Each function handles its own operators and calls the next, stronger one for its operands:

| Level (weakest first) | Function | Operators |
| --- | --- | --- |
| 1 | `parseTernary` | `? :` |
| 2 | `parseOr` | `\|\|` |
| 3 | `parseAnd` | `&&` |
| 4 | `parseEquality` | `==` `!=` |
| 5 | `parseRelational` | `<` `>` `<=` `>=` |
| 6 | `parseAdditive` | `+` `-` |
| 7 | `parseMultiplicative` | `*` `/` `%` |
| 8 | `parseUnary` | `-` `+` `!` |
| 9 | `parsePrimary` | numbers, text, variables, `min(...)`, `( ... )` |

For `1 + 2 * 3`, `parseAdditive` reads `1`, sees `+`, and asks `parseMultiplicative` for the right side. That function reads `2 * 3` completely first. So the tree contains `2 * 3` inside the `+`, and the answer is 7.

In `cout << a + b`, each item after `<<` is read at the additive level, which is why `cout << a + b` works and `cout << (a < b)` needs brackets, exactly as in real C++.

#### The syntax tree

The `if` statement from the game:

```cpp
if (d1 < d2) { cout << d1 << endl; } else { cout << d2 << endl; }
```

becomes this tree (simplified):

```
if
├── cond:  bin "<"
│            ├── var d1
│            └── var d2
├── then:  block
│            └── cout [ expr(var d1), endl ]
└── otherwise: block
             └── cout [ expr(var d2), endl ]
```

Every node is a plain JavaScript object such as `{ type: "if", cond, then, otherwise, line }`. The tree **is** the program, stored as data.

#### Compile errors come from the parser

The parser also acts like a compiler, because it checks the program before anything runs:

- **Missing pieces:** `expected ';' before '}'`. For a missing semicolon it reports the line of the *previous* token, which is where the mistake really is.
- **Undeclared variables:** while parsing, it keeps a list of the variable names declared in each block (a stack of sets). Using a name that is not in any open block gives `'d3' was not declared in this scope`.
- **Declared twice:** `redeclaration of 'x'`.
- **Misplaced keywords:** `'else' without a previous 'if'`, `break statement not within a loop` (it counts how deep inside loops it is).
- **Unsupported things:** arrays, `char`, vectors and so on give `... is not supported in this game yet`.
- **No `main`:** `start your program with int main() { ... }`.

When the parser finds an error it stops, and the game marks that line in red in the editor.

### 10.6 Stage 3: the executor (running the tree)

The executor walks the tree and does what each node says.

#### Values carry their type

Every value is a small object `{ t: "int", v: 42 }`, with `t` the type and `v` the value. The type matters because C++ behaves differently for whole numbers and decimals:

| Expression | Result | Why |
| --- | --- | --- |
| `7 / 2` | `3` | both `int`, so whole-number division (`Math.trunc`) |
| `7.0 / 2` | `3.5` | one side is `double` |
| `7 % 3` | `1` | remainder |
| `int x = 3.9;` | `3` | storing a decimal in an `int` cuts it off |
| `5 / 0` | error | `division by zero` |

Booleans are stored as `1` and `0`, and `cout` prints them that way, as real C++ does.

#### Variables and scopes

The running program keeps a stack of **scopes**. Each scope is a JavaScript `Map` from a name to `{ type, v }`. Every `{ ... }` block pushes a new scope when it starts and removes it when it ends (in a `finally` block, so it is cleaned up even when an error happens). Looking up a variable searches from the innermost scope outwards. This is why a variable declared inside a loop starts fresh on every round.

#### Control flow

- `if` evaluates the condition and runs one branch.
- `while` and `for` repeat. `break` and `continue` do not throw errors. A statement can return a small signal object (`{ type: "break" }`), which the loop reads and reacts to.
- Every statement execution and every loop round calls `tick()`, which uses up one point from a **step budget** (see [10.11](#1011-safety)).

#### Input and output

- `cout` pushes pieces of text into an output list. `endl` pushes a new line. Decimal numbers are shown with about 6 significant digits, like C++.
- `cin >> a >> b;` reads one token from the input queue for each variable and converts it to that variable's type. It reports an error if the input is not a number.
- `cin.ignore();` does nothing. In a real program it skips a leftover new line, but here the input is already split into tokens.

### 10.7 The clever part: pausing with generators

A game program looks like this:

```cpp
while (1) {
    int d1; cin >> d1;
    int d2; cin >> d2;
    // ... decide and print ...
}
```

`while (1)` never ends by design. A normal loop would freeze the browser forever. Yet the program must still *wait* for the next two numbers on every round.

The solution is the JavaScript **generator**. A generator function (`function*`) can pause in the middle with `yield` and be resumed later, with all its variables intact. Every statement in the executor is a generator, and the only place that pauses is reading input:

```js
function* readToken(ctx) {
    while (ctx.input.length === 0) {
        yield NEED_INPUT;      // "I have nothing to read. Pause here."
    }
    return ctx.input.shift();
}
```

So when `cin >> d1;` runs with an empty input queue, the whole program freezes at exactly that spot, in the middle of the loop. The game can then feed new numbers and wake the program up, and it continues from the same line as if nothing happened.

### 10.8 Talking to the program turn by turn

`createSession(program)` creates the running program and returns an object with one method, `turn(tokens)`:

```js
turn(tokens) {
    ctx.input.push(...tokens);   // give the program its new input
    ctx.output = [];             // clear what it printed before
    ctx.budget = STEP_LIMIT;     // give it a fresh step budget

    const step = generator.next();   // run until it pauses or finishes
    if (step.done) finished = true;

    return { output: ctx.output.join(""), finished, error: failure };
}
```

One call to `turn` is one turn of the game:

```
Game                                  Program (generator)
 │                                         │
 │  turn(["34", "81"]) ───────────────────►│ wakes up at "cin >> d1"
 │                                         │ d1 = 34, d2 = 81
 │                                         │ if (d1 < d2) → cout << 34
 │                                         │ loop again → "cin >> d1"
 │                                         │ queue is empty → PAUSE
 │  ◄─────  { output: "34\n" }  ───────────│
 │                                         │
 │  turn(["92", "47"]) ───────────────────►│ wakes up again, same variables alive
 │  ◄─────  { output: "47\n" }  ───────────│
```

What the three fields mean:

- `output`: everything the program printed during this turn.
- `finished`: `true` if the program ended (for example `main` returned, or an error stopped it). Later turns then print nothing.
- `error`: a runtime error with its line number, or `null`.

### 10.9 From program output to a game result

`runLevel(source, level)` in `game1Logic.js` connects the interpreter to the game:

1. Call `compile()`. If it fails, return the compile error and do not start the game.
2. Call `createSession()`.
3. For every wave `[d1, d2]` of the level, call `session.turn([String(d1), String(d2)])`.
4. Split the output into lines and judge them:

| What the program did | Outcome | What happens in the game |
| --- | --- | --- |
| Printed the smaller distance | `clear` | The closest ship is destroyed and the next wave starts |
| Printed the larger distance | `wrong` | The far ship is destroyed, but the closer ship rams you |
| Printed a number that is not `d1` or `d2` | `miss` | The shot misses, the closest ship rams you |
| Printed nothing, or more than one line | `idle` | Nothing is fired, the closest ship rams you |
| A runtime error happened | `error` | The ship is destroyed and the console shows the error |

The run stops at the first turn that is not `clear`. If every wave was `clear`, the level is passed. The result is a list of turns, and the animation simply acts it out (see [section 11](#11-how-the-space-defender-game-works)).

### 10.10 A full walkthrough

Take this program and the first wave, `d1 = 34` and `d2 = 81`:

```cpp
#include <iostream>
using namespace std;

int main() {
    while (1) {
        int d1;
        cin >> d1;
        int d2;
        cin >> d2;
        if (d1 < d2) {
            cout << d1 << endl;
        } else {
            cout << d2 << endl;
        }
    }
}
```

**1. Lexer.** The `#include` line is skipped. The rest becomes tokens: `using namespace std ;`, `int main ( ) {`, `while ( 1 ) {` and so on, each with its line number.

**2. Parser.** It skips `using namespace std;`, expects `int main ( )`, and builds the tree: a block containing a `while` whose condition is the number `1` and whose body is a block of two declarations, two `cin` statements and one `if / else`. While parsing it records `d1` and `d2` as declared, so using them later is allowed.

**3. Session created.** Nothing runs yet. The generator is ready at the first statement.

**4. `turn(["34", "81"])`:**

| Step | What happens | State |
| --- | --- | --- |
| 1 | `while (1)`: the condition `1` is true, enter the body (new scope) | |
| 2 | `int d1;` | `d1 = 0` |
| 3 | `cin >> d1;` reads `"34"` from the queue | `d1 = 34`, queue `["81"]` |
| 4 | `int d2;` then `cin >> d2;` reads `"81"` | `d2 = 81`, queue empty |
| 5 | `if (d1 < d2)`: `34 < 81` is true, run the first block | |
| 6 | `cout << d1 << endl;` | output: `34` and a new line |
| 7 | End of the body, back to `while (1)`: still true, enter the body again (a **fresh** scope) | |
| 8 | `int d1;` | new `d1 = 0` |
| 9 | `cin >> d1;` the queue is empty, so the generator **pauses** | `turn` returns `{ output: "34\n" }` |

**5. Judge.** The output `34` equals `d1`, so the program shot ship 1. Since `34 < 81`, ship 1 is the closest, so the outcome is `clear`.

**6. `turn(["92", "47"])`.** The program wakes up at step 9. Now `d1 = 92` and `d2 = 47`, `92 < 47` is false, the `else` block runs and prints `47`, which is correct again.

### 10.11 Safety

Running a stranger's code is dangerous, so the design avoids the risks:

- **No `eval`, no `new Function`.** The student's text is never run as JavaScript. It is parsed into a tree and walked by the executor, which only knows the small set of operations listed above. There is no way to reach the file system, the network, the page, cookies or the database.
- **Step budget.** Each turn the program gets 20,000 steps (`STEP_LIMIT`). Every statement and every loop round costs one. An endless loop like `while (1) { }` runs out of steps and the student sees "your program ran for too long. Check for an endless loop that never reads input" instead of a frozen page.
- **Errors never crash the website.** Compile and runtime problems are caught and turned into messages.
- **Everything runs in the student's own browser.** The server never sees or runs the code.

### 10.12 Limitations, and how to extend it

It is a teaching tool, not a full compiler:

- It supports only the subset in [10.3](#103-what-c-is-supported). Real C++ has hundreds of other features.
- Integers are JavaScript numbers, so overflow does not behave like C++ `int`.
- Only one `main` function is allowed.

Common ways to extend it:

| You want | Where to change |
| --- | --- |
| A new built-in function, such as `pow(a, b)` | Add it to `BUILTIN_FUNCS` and to the `call` case in `evalExpr` |
| A new operator | Add it to `TWO_CHAR_OPS` or `ONE_CHAR_OPS`, to the right `parse...` level, and to `applyBinary` |
| A new statement, such as `do ... while` | Remove it from `UNSUPPORTED_WORDS`, add a `parseDoWhile` in the parser and a `case` in `execStatement` |
| Arrays or vectors | Add a new value type, new syntax in `parseDeclaration` and `parsePrimary`, and index operations in the executor |
| A different game | Write a new `...Logic.js` like `game1Logic.js` that feeds different input and judges different output. The interpreter stays the same |

For serious algorithm problems (graphs, sorting, large inputs), a real server-side judge is the better choice. The rest of the game code can stay the same, because it only needs "run this code on this input and give me the output".

### 10.13 Testing it quickly

The interpreter is plain JavaScript, so you can try it in Node without a browser:

```js
import { compile, createSession } from "./cppInterpreter.js";

const result = compile(`
  int main() {
    while (1) {
      int a, b;
      cin >> a >> b;
      cout << (a < b ? a : b) << endl;
    }
  }
`);

if (!result.ok) {
  console.log(result.error);               // { line, message }
} else {
  const session = createSession(result.program);
  console.log(session.turn(["5", "3"]));   // { output: "3\n", finished: false, error: null }
  console.log(session.turn(["2", "9"]));   // { output: "2\n", finished: false, error: null }
}
```

---

## 11. How the Space Defender game works

The full path from a button click to the explosion:

```
Submit
  │
  ▼
runLevel(code, level)            game1Logic.js + cppInterpreter.js
  │   compile → run every wave → judge each turn
  ▼
a list of turns                  [{ d1, d2, closest, shot, outcome, output, message }, ...]
  │
  ▼
startScript(scene, turns)        spaceBattleEngine.js
  │   builds a timeline of timed steps
  ▼
requestAnimationFrame loop       SpaceBattle.jsx, 60 times per second
  │   updateScene() moves the timeline forward, drawScene() paints the canvas
  ▼
events: wave / cleared / finish  sent back to Game1.jsx
  │
  ▼
HUD, console and the "Level complete / Mission failed" screen
```

Key points:

- **The code runs first, the animation second.** The animation never runs the student's code. It only plays the recorded result.
- **Timeline per wave:** ships fly in, the program's output appears next to the player, a targeting circle locks on, the laser fires, and then either the other ship retreats (correct) or it rushes into the player's ship (wrong).
- **Distances become positions.** A ship at distance `d` is drawn at `x = 190 + d * 4.4` on a 800 x 450 canvas, so closer ships really are closer to the player.
- **Levels.** Level 1 has 5 waves with clear gaps, level 2 has 8 waves with almost equal distances, and level 3 has 12 waves of random distances (always the same ones, made from a fixed seed). Passing a level unlocks the next one for the current visit.
- **The code editor** is two layers on top of each other: a coloured copy of the code at the back and a normal, invisible-text text box in front. They scroll together.
- **Speed.** The animation can run at 1x, 2x or 4x, and large time jumps (for example when the tab was in the background) are limited so it never skips ahead strangely.

---

## 12. Security notes

- Passwords are hashed with bcrypt and never stored or returned as plain text.
- Login tokens are signed, expire after 7 days, and carry the user id and role. The server always takes the user id from the token.
- Every database query uses placeholders (`?`), which prevents SQL injection.
- Uploaded files are checked for type, size and real content, get random names, and the old file is deleted when it is replaced.
- User links (GitHub, LinkedIn, portfolio) must start with `http://` or `https://`, so they can not contain `javascript:` links.
- Text from users is shown as plain text by React, so it can not inject HTML.
- Rate limits: 30 messages per minute and 10 posts per hour per student.
- Private profiles are hidden from search, rankings and the posts feed. Blocked students can not see each other's posts or message each other.
- Admins can not be created through the website. Only `npm run seed-admin` creates them.
- Keep `.env` and the `uploads` folder out of Git.

Before going live you should also add: HTTPS, stricter CORS, a limit on login attempts, a storage service for uploads, and email verification.

---

## 13. Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| `Cannot GET /api/...` in the browser | The backend does not have that route yet. Make sure the route file exists in `Backend/src/routes` and is loaded in `server.js`, then restart |
| `Cannot find module ...` when the backend starts | A file is missing or in the wrong folder, or a package is not installed. Run `npm install` and check the path in the error |
| "Cannot reach the server" on the website | The backend is not running, or the port in `Frontend/src/api.js` is wrong |
| Requests are blocked (CORS error) | The website must run on `http://localhost:5173`, or change the allowed address in `server.js` and `socket.js` |
| `Database connection failed` | MySQL is not running, or the settings in `src/config/db.js` are wrong |
| `Error while setting up the database` | Check the `.env` values and that MySQL is running. Paste the error line when asking for help |
| Login says "Invalid credentials" | Wrong role tab, email or password. Admins use their login key, not an email |
| Messages do not appear live | Check the browser console for a connection error and that `socket.js` is in `Backend/src` |
| Uploaded photos do not show | Check that the `uploads` folder exists in `Backend` and that `server.js` publishes it |
| The page looks unstyled | Tailwind is not set up in `vite.config.js` and `index.css`. Restart `npm run dev` after changing them |

---

## 14. Roadmap

- [x] Accounts, roles and protected pages
- [x] Student dashboard and charts
- [x] Student profiles, search and editing
- [x] Messaging between students
- [x] Posts and likes
- [x] Games list and Game 1 with the in-browser C++ interpreter
- [ ] Comments on posts
- [ ] Admin pages: verify companies and posts, create contests, flag AI-generated code
- [ ] Company pages: profile, post jobs, view and shortlist applicants
- [ ] Practice problems with a real code judge and algorithm animations
- [ ] Contests with live ranking and rating changes
- [ ] Job applications with company contests
- [ ] Premium purchase and mock interviews
- [ ] More games (Game 2 and Game 3)
- [ ] Companies messaging shortlisted students

---

## License

Add your license here.