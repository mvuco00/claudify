import { execFileSync } from "node:child_process";
import { type NotifyOptions } from "../types.js";

export function sendMacOS(options: NotifyOptions): void {
  const { title, message, subtitle, sound, noSound } = options;

  // JSON.stringify produces valid AppleScript double-quoted string literals
  // (backslash-escaped). Safe against injection — execFileSync array form,
  // no shell involved.
  let script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`;

  if (subtitle) {
    script += ` subtitle ${JSON.stringify(subtitle)}`;
  }

  if (!noSound && sound) {
    script += ` sound name ${JSON.stringify(sound)}`;
  }

  execFileSync("osascript", ["-e", script]);
}
