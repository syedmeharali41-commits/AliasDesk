<div align="center">
  <img src="public/logo.png" width="110" alt="AliasDesk Logo" />
  <h1>AliasDesk</h1>
  <p><b>Next-Generation Cloudflare Email Routing & Isolated Browser Workspace</b></p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(x64)-blue.svg?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-red.svg?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Next.js-16.1%20(Turbopack)-black.svg?style=flat-square" alt="Next.js" />
    <img src="https://img.shields.io/badge/Electron-44.1-47848F.svg?style=flat-square" alt="Electron" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat-square" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Cost-~$1%2FYear%20Unlimited%20Emails-success.svg?style=flat-square" alt="Cost" />
  </p>
</div>

---

## 📌 What is AliasDesk?

**AliasDesk** is a clean, fast desktop app that gives you **unlimited custom-domain emails for just ~$1/year**. 

Instead of paying for expensive email inboxes or dealing with blocked fake/temp-mail services, you connect **one cheap $1 domain** and get **infinite emails**. Every single OTP, verification link, or message sent to any alias lands directly in your personal Gmail or Outlook inbox — with zero setup hassle and no password juggling!

---

## 💡 The $1/Year Lifehack: Unlimited Custom Emails for 1 Year

> **Why pay $6/month per inbox on Google Workspace or Microsoft 365 when you can have UNLIMITED emails for just ~$1 a year?**

### 🧠 How It Works:
1. **Buy 1 Cheap Domain for 1 Year (~$1.00 - $2.00)**:
   - Purchase any inexpensive domain (such as `.xyz`, `.top`, `.online`, `.site`, or `.tech`) from Namecheap, Porkbun, or Cloudflare for about **$1.00 for the whole year**.
2. **Add Domain to Cloudflare (100% Free)**:
   - Cloudflare Email Routing is completely free forever with unlimited forwards and zero limits.
3. **Turn On Catch-All in AliasDesk**:
   - Route `*@yourdomain.com` straight into your personal Gmail or Outlook inbox.
4. **Generate Unlimited Emails**:
   - You now have access to **infinite unique email addresses** (`user1@yourdomain.com`, `test.ai@yourdomain.com`, `deal_94@yourdomain.com`).
   - Every verification code and OTP lands in your personal inbox instantly!
   - **Total Cost**: ~$1.00/year for 1,000 to 100,000+ emails!

### 📊 Cost & Value Comparison

| Solution | Annual Cost | Alias Limits | Custom Domain | Anti-Detect Sandboxing | OTP / Privacy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 👑 **AliasDesk + Cloudflare** | **~$1.00 / year** | **UNLIMITED (∞)** | ✅ Full Custom Domain | ✅ Isolated Ephemeral Profiles | 🛡️ 100% Private & Instant |
| **Google Workspace** | $72 - $144 / year | 30 per user | ✅ Yes | ❌ None | ⚠️ Expensive per inbox |
| **SimpleLogin / AnonAddy** | $30 - $36 / year | Limited on free | ⚠️ Requires paid plan | ❌ None | ⚠️ Shared domain flags |
| **Public Temp-Mail Services** | "Free" | 1 temporary | ❌ Public domain only | ❌ None | 🚨 Blocked by most websites |

---

### 🎯 Who is This For? (Popular Everyday Uses)

- 🤖 **Unlimited Free AI Tools & Credits**: Create fresh accounts on **ChatGPT, Claude, Midjourney, Cursor AI, Flux, Suno, ElevenLabs**, and other image/chat AI tools to easily claim free trial credits without buying phone numbers or paid plans.
- 🎁 **Unlimited Free Trials & Discounts**: Sign up for streaming trials, software trials, and shopping promo codes over and over without cluttering your real email.
- 🥷 **100% Spam-Free Privacy**: Use a unique alias for every website (`netflix@yourdomain.com`, `crypto@yourdomain.com`). You will instantly spot anyone who sells or leaks your email.
- ⚡ **Multi-Account & Airdrop Hunters**: Run separate accounts with our 1-click isolated browser profiles without getting linked, fingerprinted, or banned.
- 🧪 **Testers & Developers**: Test app signups and email verification flows with thousands of active addresses in seconds.

---

## ✨ Key Features

### 1. ⚡ Real-Time Cloudflare Email Routing
- Connect any custom domain hosted on Cloudflare with a single API token.
- Automatic verification of DNS records (MX, SPF, DKIM) directly in the UI.
- Support for **Catch-All Forwarding** (`*@yourdomain.com` ➔ `your-inbox@gmail.com`).

### 2. 🎲 Ultra-Fast Alias Pool Generation
- Generate **1,000 to 100,000 aliases in under 10 milliseconds**.
- Multi-pattern algorithms:
  - `user_random`: `user_1024_8492@domain.com`
  - `name_number`: `alex.2041@domain.com`
  - `uuid_short`: `id_1_9f82a@domain.com`
  - `clean_tag`: `usr.0001@domain.com`
- Instant export to TXT, CSV, or JSON.

### 3. 🛡️ Anti-Detect Isolated Browser Sandboxing
- Launch completely isolated browser sessions (Chrome, Edge, or Brave) directly tied to any alias.
- Each session runs with a dedicated ephemeral profile directory in `%TEMP%/aliasdesk_profiles/session_<id>`.
- **Zero-Trace Sanitation**: 1-click permanent disk wipe removes all cookies, cache, storage, and history upon closing.

### 4. ⌨️ Quick Copy Command Palette
- Press **`Ctrl + K`** anywhere inside the app to search and instantly copy any alias to your clipboard.

### 5. 🎨 Monolithic Luxury Dark Interface
- Designed with an obsidian-inspired dark theme, dynamic warm gold accents, fluid animations, and responsive layouts.

---

## 🔄 How the Complete Workflow Operates

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ 1. Cloudflare Catch-All │ ──> │ 2. Generate Alias Pool  │ ──> │ 3. Launch Isolated      │
│    (*@domain.com)       │     │    (1,000 - 100k)       │     │    Browser Sandbox      │
└─────────────────────────┘     └─────────────────────────┘     └───────────┬─────────────┘
                                                                            │
┌─────────────────────────┐     ┌─────────────────────────┐                 │
│ 5. 1-Click Zero-Trace   │ <── │ 4. Receive OTP & Emails │ <───────────────┘
│    Sanitation & Wipe    │     │    in Main Primary Inbox│
└─────────────────────────┘     └─────────────────────────┘
```

---

## 🚀 Installation & Downloads

### ⭐️ Recommended: Windows Installer (Setup)
Download the installer from the repository releases:
- **`AliasDesk-Setup-1.0.0.exe`** (Installs to your local user directory and creates a Desktop shortcut).

### 💼 Portable Edition
- **`AliasDesk-Portable-1.0.0.exe`** (Run immediately without installation).

---

## 🛠️ Running from Source Code

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/syedmeharali41-commits/AliasDesk.git
cd AliasDesk
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root folder:
```env
DATABASE_URL="file:./prisma/db/custom.db"
```

### 4. Initialize Database
```bash
npx prisma db push
```

### 5. Launch in Development Mode
To run Next.js and Electron together:
```bash
npm run app
```

Or run the web version in your browser (`http://localhost:3000`):
```bash
npm run dev
```

### 6. Build Desktop Executables
To build the production `.exe` packages:
```bash
npm run dist
```
*Outputs will be located in the `dist/` directory.*

---

## 🔑 Cloudflare API Configuration

To enable live synchronization with Cloudflare:
1. Go to your **[Cloudflare Dashboard](https://dash.cloudflare.com/)** ➔ **My Profile** ➔ **API Tokens**.
2. Click **Create Token** ➔ select **Create Custom Token**.
3. Set the following permissions:
   - `Zone` — `Email Routing Rules` — **Edit**
   - `Zone` — `Zone` — **Read**
   - `Zone` — `DNS` — **Read**
4. Set Zone Resources to **All Zones** (or select your target domain).
5. Copy the token and paste it into the AliasDesk onboarding wizard.

---

## ❓ Frequently Asked Questions (FAQ)

### Q: Is it really unlimited emails for ~$1 a year?
**Yes.** You only pay the registrar for your custom domain registration (e.g. ~$1 to $2 per year for `.xyz`, `.online`, or `.site`). Cloudflare provides the Email Routing backbone 100% free of charge without any message limits or artificial caps.

### Q: Do websites block aliases created with AliasDesk?
**No.** Websites frequently block free disposable email providers (like 10-Minute Mail or GuerrillaMail) because their public domains are blacklisted. With AliasDesk, every alias is hosted on **your private custom domain**, so it looks 100% legitimate to all verification systems.

### Q: Can I use this with my existing Gmail or Outlook?
**Yes.** Cloudflare Email Routing forwards all incoming traffic to any verified destination email address. You never need to change your primary inbox or create new logins.

### Q: How does the isolated browser sandboxing work?
AliasDesk launches isolated Chromium instances (Chrome, Edge, or Brave) using dynamic, separate `--user-data-dir` profiles in your `%TEMP%` directory. Once closed, you can perform a 1-click zero-trace sanitization to completely wipe all local session traces from your disk.

---

## 📄 License & Legal Notice

```text
PROPRIETARY & CONFIDENTIAL
Copyright (c) 2026 Syed Mehar Ali. All rights reserved.
```

This software and its source code are strictly proprietary. Unauthorized copying, modification, reverse engineering, redistribution, or commercial use of this codebase, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

For commercial licensing, permissions, or inquiries, please contact the repository owner.
