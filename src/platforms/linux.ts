import { execFileSync } from "node:child_process";
import { type NotifyOptions } from "../types.js";

export function sendLinux(options: NotifyOptions): void {
  const { title, message } = options;

  try {
    execFileSync("notify-send", ["--app-name=Claude Code", title, message]);
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && err.message.includes("ENOENT");
    if (isNotFound) {
      process.stderr.write(
        "[claudify] notify-send not found. Install libnotify-bin (Debian/Ubuntu) or libnotify (Arch).\n"
      );
    } else {
      process.stderr.write(`[claudify] notify-send failed: ${String(err)}\n`);
    }
  }
}
