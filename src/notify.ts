import { type Notifier, type NotifyOptions } from "./types.js";
import { detectPlatform } from "./platforms/detect.js";
import { sendMacOS } from "./platforms/macos.js";
import { sendLinux } from "./platforms/linux.js";
import { sendWindows } from "./platforms/windows.js";

const notifiers: Record<string, Notifier> = {
  macos: sendMacOS,
  linux: sendLinux,
  windows: sendWindows,
};

export function sendNotification(options: NotifyOptions): void {
  const platform = detectPlatform();

  if (!platform) {
    process.stderr.write(
      `[claudify] Unsupported platform: ${process.platform}. Skipping notification.\n`
    );
    return;
  }

  notifiers[platform](options);
}
