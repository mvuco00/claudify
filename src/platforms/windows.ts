// EXPERIMENTAL — tested on Windows 10+ only.
// Uses inline PowerShell with Windows.UI.Notifications (no BurntToast required).
import { execFileSync } from "node:child_process";
import { type NotifyOptions } from "../types.js";

export function sendWindows(options: NotifyOptions): void {
  const { title, message } = options;

  // Escape single quotes for PowerShell string literals
  const safeTitle = title.replace(/'/g, "''");
  const safeMessage = message.replace(/'/g, "''");

  const script = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
  [Windows.UI.Notifications.ToastTemplateType]::ToastText02
)
$template.SelectSingleNode('//text[@id=1]').InnerText = '${safeTitle}'
$template.SelectSingleNode('//text[@id=2]').InnerText = '${safeMessage}'
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('claudify').Show($toast)
`.trim();

  try {
    execFileSync("powershell", ["-NoProfile", "-Command", script]);
  } catch (err: unknown) {
    process.stderr.write(`[claudify] Windows toast failed: ${String(err)}\n`);
  }
}
