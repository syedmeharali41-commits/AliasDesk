# AliasDesk

## Overview
AliasDesk is a high-performance desktop application for Cloudflare Email Routing & Alias Management. It combines a Next.js (App Router, React 19, Tailwind CSS v4, Lucide) frontend with an Electron desktop wrapper for isolated browser launching and Cloudflare API integration.

## Tech Stack
- **Framework**: Next.js 16 (Turbopack, App Router, Standalone output)
- **Desktop**: Electron 44, electron-builder
- **Styling**: Tailwind CSS v4, Radix UI, Framer Motion, Lucide React
- **State**: Zustand
- **Database**: Prisma with SQLite (`prisma/schema.prisma`)

## Key Commands
- `npm run app`: Start Next dev server and launch Electron in dev mode.
- `npm run dev`: Next.js development server.
- `npm run build`: Build Next.js application.
- `npm run dist`: Package production Windows application (NSIS installer).
- `npm run dist:dir`: Build unpacked Windows application directory for testing.
- `npm run dist:portable`: Build single-file portable Windows executable.
