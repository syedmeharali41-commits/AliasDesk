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

**AliasDesk** is a desktop application engineered for power users, developers, and privacy enthusiasts who manage high-volume email workflows and multi-account automation. 

By integrating directly with **Cloudflare Email Routing**, AliasDesk enables you to generate, route, and manage unlimited custom-domain email aliases without ever having to create or log into separate email accounts. Every verification code, OTP, or email sent to any alias is delivered in real-time to your primary inbox.

---

## 💡 The $1/Year Lifehack: Unlimited Custom Emails for 1 Year

> **Why pay $6/month per inbox on Google Workspace or Microsoft 365 when you can have UNLIMITED emails for just ~$1 a year?**

### 🧠 How It Works:
1. **Buy 1 Cheap Domain for 1 Year (~$1.00 - $2.00)**:
   - Purchase any inexpensive domain extension (such as `.xyz`, `.top`, `.online`, `.site`, or `.tech`) from registrars like Namecheap, Porkbun, or Cloudflare Registrar for around **$1.00 - $1.50 for a full year**.
2. **Add Domain to Cloudflare (100% Free)**:
   - Point your domain's nameservers to Cloudflare. Cloudflare's Email Routing feature is completely free forever with zero sending limits or inbox caps.
3. **Turn On Catch-All in AliasDesk**:
   - In AliasDesk, route `*@yourdomain.com` directly to your personal Gmail or Outlook address.
4. **Generate Unlimited Emails**:
   - You now have access to **infinite unique email addresses** (`netflix.user@yourdomain.com`, `paypal.secure@yourdomain.com`, `account_9482@yourdomain.com`).
   - Every confirmation email, activation link, and OTP lands in your personal primary inbox instantly!
   - **Total Annual Cost**: ~$1.00/year for 1,000, 10,000, or even 100,000+ separate emails!

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

## 📄 License & Legal Notice

```text
PROPRIETARY & CONFIDENTIAL
Copyright (c) 2026 Syed Mehar Ali. All rights reserved.
```

This software and its source code are strictly proprietary. Unauthorized copying, modification, reverse engineering, redistribution, or commercial use of this codebase, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

For commercial licensing, permissions, or inquiries, please contact the repository owner.
