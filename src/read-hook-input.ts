import { readSync } from "node:fs";
import { type HookInput } from "./types.js";

const STDIN_TIMEOUT_MS = 5000;
const STDIN_FD = 0;

export function readHookInput(): HookInput {
  // Skip stdin if not piped (TTY) — avoids hanging when run interactively
  if (process.stdin.isTTY) {
    return { hook_event_name: "" };
  }

  let raw = "";
  const buf = Buffer.alloc(4096);
  const deadline = Date.now() + STDIN_TIMEOUT_MS;

  while (true) {
    if (Date.now() > deadline) {
      process.stderr.write("[claudify] stdin timeout — no input received.\n");
      return { hook_event_name: "" };
    }

    let bytesRead: number;
    try {
      bytesRead = readSync(STDIN_FD, buf, 0, buf.length, null);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EAGAIN" || code === "EWOULDBLOCK") continue;
      break;
    }

    if (bytesRead === 0) break;
    raw += buf.slice(0, bytesRead).toString("utf8");
  }

  if (!raw.trim()) return { hook_event_name: "" };

  try {
    return JSON.parse(raw) as HookInput;
  } catch {
    process.stderr.write(
      `[claudify] Failed to parse stdin JSON: ${raw.slice(0, 120)}\n`
    );
    return { hook_event_name: "" };
  }
}
