# ⚡ AliasDesk — Complete Operational Working Plan (Step-by-Step Logic)

> **Purpose**: This document explains **EXCLUSIVELY HOW THE TOOL WORKS** in a structured, step-by-step working plan. Any AI agent or developer reading this will understand the entire operational loop, execution flow, data pathways, and browser isolation mechanics.

---

## 🔄 THE COMPLETE 5-STEP WORKING LOOP

```
[ 1. User Domain Setup ] ➔ [ 2. Generate 1k-100k Pool ] ➔ [ 3. Launch Isolated Browser ]
                                                                       │
[ 5. 1-Click Destroy & Wipe ] 🠔 [ 4. Receive OTP in Main Inbox & Work ] 🠔─┘
```

---

## 📌 STEP 1: Cloudflare Catch-All Email Routing (Pre-requisite)

### 🎯 How It Works:
Instead of creating 10,000 separate email accounts (which requires phone verification and time), the user connects **ONE single custom domain** to Cloudflare Email Routing.

1. **Catch-All Rule Active**:
   - `*@yourdomain.com` ➔ Forwards directly to `your-personal-email@gmail.com`.
2. **Result**:
   - Any random email address sent to `@yourdomain.com` (e.g. `user_9482@yourdomain.com`, `alex.8291@yourdomain.com`, `id_9921@yourdomain.com`) is immediately delivered to the user's personal Gmail/Outlook inbox in real-time.
   - The user **never** needs to log into different email accounts to read verification emails or OTP codes.

---

## 📌 STEP 2: In-Memory Alias Pool Generation

### 🎯 How It Works:
1. **User Input**:
   - Domain: e.g. `mybrand.com`
   - Pool Count: `1,000`, `10,000`, `50,000`, or `100,000`
   - Pattern:
     - `user_random`: `user_0001_8492@mybrand.com`
     - `name_number`: `alex.1042@mybrand.com`
     - `uuid_short`: `id_1_9f82a@mybrand.com`
     - `clean_tag`: `usr.0001@mybrand.com`
2. **Execution Logic (`src/lib/utils.ts`)**:
   - Fast deterministic random string generator runs in-memory.
   - Generates **10,000 unique aliases in <10ms** (or 100,000 in <80ms).
   - Stores the generated pool in local Zustand state and displays it in a high-density, searchable table.
3. **Export Capability**:
   - 1-click export of the entire pool as `.TXT`, `.CSV`, or `.JSON` for bulk tools.

---

## 📌 STEP 3: 1-Click Isolated Browser Profile Launch

### 🎯 How It Works:
When the user hovers over any email alias and clicks **`[ ▶ Start ]`**:

1. **Native IPC Call**:
   - React invokes the Rust Tauri backend command `launch_session(alias, enableWarp)`.
2. **Dedicated Disk Sandboxing (`src-tauri/src/browser.rs`)**:
   - Rust generates a unique UUID (e.g. `session_8f3a9b1c`).
   - Rust creates a brand new, isolated temporary directory on disk:
     `C:/Users/<User>/AppData/Local/Temp/aliasforge_profiles/session_8f3a9b1c`
3. **Browser Process Execution**:
   - Rust automatically detects the local browser binary (`chrome.exe`, `msedge.exe`, `brave.exe`).
   - Rust launches the browser process with strict isolation arguments:
     ```bash
     chrome.exe        --user-data-dir="C:/Users/.../AppData/Local/Temp/aliasforge_profiles/session_8f3a9b1c"        --no-first-run        --no-default-browser-check        --disable-sync        --disable-default-apps        --disable-background-networking        --proxy-server="socks5://127.0.0.1:40000" (Only if WARP Proxy toggle is ON)
     ```
4. **Session HUD & Clipboard Auto-Copy**:
   - The alias email is automatically copied to the Windows clipboard.
   - Rust returns the process `PID` and `profilePath` to the frontend.
   - React displays the **Active Session HUD** with a live real-time duration counter and process PID.

---

## 📌 STEP 4: User Workflow & OTP Verification

### 🎯 How It Works:
1. The isolated Chrome window opens up completely clean (zero cookies, zero browsing history, separate cookie jar).
2. The user pastes the email (`user_0001_8492@mybrand.com`) on target websites (ChatGPT, Claude, AWS, SaaS trials, social media, etc.).
3. When the website sends a verification code / OTP:
   - The OTP arrives in the user's main personal Gmail inbox within 2-3 seconds.
   - The user enters the OTP in the isolated browser and finishes their work.

---

## 📌 STEP 5: 1-Click Profile Destruction & Zero-Trace Wipeout

### 🎯 How It Works:
When the user is done with their task, they click **`[ 💥 1-Click Destroy & Wipe Profile ]`**:

1. **Process Termination**:
   - React invokes `destroy_session(activeSession)`.
   - On Windows, Rust executes:
     ```cmd
     taskkill /F /T /PID <pid>
     ```
   - This immediately force-kills the Chrome parent process and all child renderer/GPU helper threads.
2. **Permanent Disk Sanitation**:
   - Rust pauses for 300ms to allow Windows OS to release all file locks.
   - Rust executes:
     ```rust
     std::fs::remove_dir_all(&profile_path)
     ```
   - The temporary profile folder is completely wiped from disk.
3. **Result**:
   - All session cookies, localStorage, IndexedDB, cached files, and browsing history are **100% destroyed**.
   - No company or website can link this session to any past or future sessions.
   - The alias state in the table transitions to `Wiped / Paused`.

---

## 🛡️ WHY THIS IS 100% UNDETECTABLE & UNLIMITED

| Vector | Normal Browser | AliasForge Engine |
| :--- | :--- | :--- |
| **Email Accounts** | Limited by phone verification / bans | Unlimited via Cloudflare Catch-All (`*@domain.com`) |
| **Browser Cookies** | Shared across tabs / persistent | Completely isolated in separate `--user-data-dir` |
| **Residual History** | Left on disk in `%APPDATA%/Chrome` | Permanently wiped via `std::fs::remove_dir_all` |
| **IP Routing** | Local residential IP exposed | Optional Cloudflare WARP SOCKS5 (`127.0.0.1:40000`) |
| **Multi-Account Linking** | Easily linked via Canvas / Cookies / Storage | 100% Isolated; each profile is a brand new virgin install |

---

## 🔌 TECHNICAL CONTRACT (FRONTEND ↔ RUST BACKEND)

```
[ Frontend: React / Zustand ]
   │
   ├── api.launchSession(alias, enableWarp)
   │     └── Rust: Creates Temp Profile Dir ➔ Spawns chrome.exe with --user-data-dir ➔ Returns PID
   │
   ├── api.destroySession(session)
   │     └── Rust: Runs taskkill /F /T /PID ➔ Calls std::fs::remove_dir_all() ➔ Returns Success
   │
   └── api.copyToClipboard(text)
         └── Rust: Writes string to OS clipboard
```
