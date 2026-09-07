import { NextRequest, NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/* ------------------------------------------------------------ */
/* Windows Browser Detection Paths                              */
/* ------------------------------------------------------------ */
export interface BrowserInfo {
  id: "chrome" | "msedge" | "brave";
  name: string;
  path: string;
  found: boolean;
}

function detectBrowsers(): BrowserInfo[] {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  const candidatePaths: Record<"chrome" | "msedge" | "brave", { name: string; paths: string[] }> = {
    chrome: {
      name: "Google Chrome",
      paths: [
        path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      ],
    },
    msedge: {
      name: "Microsoft Edge",
      paths: [
        path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
      ],
    },
    brave: {
      name: "Brave Browser",
      paths: [
        path.join(programFiles, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
        path.join(programFilesX86, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
        path.join(localAppData, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
      ],
    },
  };

  const results: BrowserInfo[] = [];

  for (const [id, info] of Object.entries(candidatePaths) as [("chrome" | "msedge" | "brave"), { name: string; paths: string[] }][]) {
    let resolvedPath = "";
    for (const p of info.paths) {
      if (fs.existsSync(p)) {
        resolvedPath = p;
        break;
      }
    }
    results.push({
      id,
      name: info.name,
      path: resolvedPath,
      found: !!resolvedPath,
    });
  }

  return results;
}

/* ------------------------------------------------------------ */
/* Helper to check if PID is active on Windows                  */
/* ------------------------------------------------------------ */
function isPidRunning(pid: number): boolean {
  try {
    const stdout = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    return stdout.includes(String(pid));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ */
/* GET: Return detected browsers and system status             */
/* ------------------------------------------------------------ */
export async function GET() {
  const browsers = detectBrowsers();
  return NextResponse.json({
    ok: true,
    browsers,
    tmpDir: path.join(os.tmpdir(), "aliasdesk_profiles"),
  });
}

/* ------------------------------------------------------------ */
/* POST: Launch isolated session OR Zero-trace Destroy session */
/* ------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "launch";

    /* ========================================================== */
    /* 1. LAUNCH ISOLATED BROWSER PROFILE                         */
    /* ========================================================== */
    if (action === "launch") {
      const { alias, browserType = "chrome", initialUrl } = body;
      const detected = detectBrowsers();
      
      // Select requested browser or fallback to any available browser
      let targetBrowser = detected.find((b) => b.id === browserType && b.found);
      if (!targetBrowser) {
        targetBrowser = detected.find((b) => b.found);
      }

      if (!targetBrowser || !targetBrowser.path) {
        return NextResponse.json(
          { ok: false, message: "No supported browser found (Chrome, Edge, or Brave). Please ensure one is installed." },
          { status: 400 }
        );
      }

      // 1. Temporary isolated disk sandbox creation: %TEMP%/aliasdesk_profiles/session_<id>
      const sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const baseProfilesDir = path.join(os.tmpdir(), "aliasdesk_profiles");
      const profileDir = path.join(baseProfilesDir, `session_${sessionId}`);

      if (!fs.existsSync(/*turbopackIgnore: true*/ profileDir)) {
        fs.mkdirSync(/*turbopackIgnore: true*/ profileDir, { recursive: true });
      }

      // 2. Strict isolation flags
      const args = [
        `--user-data-dir=${profileDir}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-sync",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-features=Translate,OptimizationHints,MediaRouter",
        "--disable-component-update",
        "--password-store=basic",
        "--disable-blink-features=AutomationControlled",
      ];

      // Start page (default: about:blank or custom url)
      args.push(initialUrl || "about:blank");

      // 3. Launch detached child process
      const child = spawn(targetBrowser.path, args, {
        detached: true,
        stdio: "ignore",
      });

      child.unref();

      const pid = child.pid;

      return NextResponse.json({
        ok: true,
        sessionId,
        pid,
        profileDir,
        browserName: targetBrowser.name,
        browserType: targetBrowser.id,
        startedAt: Date.now(),
        alias: alias || "unnamed",
      });
    }

    /* ========================================================== */
    /* 2. STOP BROWSER SESSION (Process Kill Only)                */
    /* ========================================================== */
    if (action === "stop") {
      const { pid, sessionId } = body;
      if (pid && typeof pid === "number" && pid > 0) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
        } catch {
          // Process may have already exited
        }
      }
      return NextResponse.json({
        ok: true,
        status: "stopped",
        stoppedAt: Date.now(),
        sessionId,
      });
    }

    /* ========================================================== */
    /* 3. ZERO-TRACE WIPEOUT & PROFILE DESTROYER (Kill + Wipe)    */
    /* ========================================================== */
    if (action === "destroy") {
      const { pid, profileDir, sessionId } = body;

      // 1. 1-Click Process Kill (taskkill /F /T /PID <pid>)
      if (pid && typeof pid === "number" && pid > 0) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
        } catch {
          // Process may have already exited
        }
      }

      // 2. Permanent Disk Sanitation (remove temp profile folder completely from disk)
      let resolvedDir = profileDir;
      if (!resolvedDir && sessionId) {
        resolvedDir = path.join(os.tmpdir(), "aliasdesk_profiles", `session_${sessionId}`);
      }

      if (resolvedDir && fs.existsSync(/*turbopackIgnore: true*/ resolvedDir)) {
        // Allow brief lock release time (150ms) then force remove
        await new Promise((resolve) => setTimeout(resolve, 150));
        try {
          fs.rmSync(/*turbopackIgnore: true*/ resolvedDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        } catch {
          try {
            execSync(`rmdir /s /q "${resolvedDir}"`, { stdio: "ignore" });
          } catch {
            // Ignored
          }
        }
      }

      return NextResponse.json({
        ok: true,
        status: "destroyed",
        wipedAt: Date.now(),
        sessionId,
      });
    }

    /* ========================================================== */
    /* 4. CHECK PID STATUS                                        */
    /* ========================================================== */
    if (action === "status") {
      const { pid } = body;
      const running = pid ? isPidRunning(pid) : false;
      return NextResponse.json({ ok: true, running });
    }

    /* ========================================================== */
    /* 5. WIPE ALL PROFILES & CACHE FROM DISK                     */
    /* ========================================================== */
    if (action === "wipe_all_profiles") {
      const targetDirs = [
        path.join(os.tmpdir(), "aliasdesk_profiles"),
        path.join(os.tmpdir(), "aliasforge_profiles")
      ];
      for (const baseDir of targetDirs) {
        if (fs.existsSync(baseDir)) {
          try {
            fs.rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 });
          } catch {
            try {
              execSync(`rmdir /s /q "${baseDir}"`, { stdio: "ignore" });
            } catch {
              // ignore
            }
          }
        }
      }
      return NextResponse.json({
        ok: true,
        status: "wiped",
        message: "All anti-detect browser profiles and session data permanently deleted from disk.",
        wipedAt: Date.now(),
      });
    }

    return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
