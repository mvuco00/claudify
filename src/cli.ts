#!/usr/bin/env node
import { readHookInput } from "./read-hook-input.js";
import { resolveOptions, getDefaultConfig } from "./config.js";
import { applyTemplate } from "./template.js";
import { sendNotification } from "./notify.js";
import { detectPlatform } from "./platforms/detect.js";
import { printSounds } from "./sounds.js";
import { type CliFlags, type NotifyOptions } from "./types.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

// --- Flag parsing ---

function parseFlags(argv: string[]): { subcommand: string | null; flags: CliFlags; rest: string[] } {
  const args = argv.slice(2);
  const flags: CliFlags = {};
  const rest: string[] = [];
  let subcommand: string | null = null;

  const SUBCOMMANDS = new Set(["init", "test", "install", "sounds"]);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith("--") && SUBCOMMANDS.has(arg) && subcommand === null) {
      subcommand = arg;
      continue;
    }

    if (arg === "--title") { flags.title = args[++i]; continue; }
    if (arg === "--message") { flags.message = args[++i]; continue; }
    if (arg === "--subtitle") { flags.subtitle = args[++i]; continue; }
    if (arg === "--sound") { flags.sound = args[++i]; continue; }
    if (arg === "--no-sound") { flags.noSound = true; continue; }

    rest.push(arg);
  }

  return { subcommand, flags, rest };
}

function getRest(rest: string[], flag: string): string | undefined {
  const idx = rest.indexOf(flag);
  return idx !== -1 ? rest[idx + 1] : undefined;
}

function getRestFlag(rest: string[], flag: string): boolean {
  return rest.includes(flag);
}

// --- Subcommands ---

function cmdInit(): void {
  const configDir = join(homedir(), ".config", "claudify");
  const configPath = join(configDir, "config.json");

  if (existsSync(configPath)) {
    process.stdout.write(`[claudify] Config already exists at ${configPath}\n`);
    process.stdout.write(`           Use --force to overwrite.\n`);
    return;
  }

  mkdirSync(configDir, { recursive: true });

  const config = {
    $schema: "https://unpkg.com/claudify/schema.json",
    ...getDefaultConfig(),
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  process.stdout.write(`[claudify] Config created at ${configPath}\n`);
  process.stdout.write(`           Note: $schema URL resolves only after the package is published to npm.\n`);
}

function cmdTest(flags: CliFlags): void {
  const options: NotifyOptions = {
    title: flags.title ?? "claudify",
    message: flags.message ?? "Notifications are working!",
    subtitle: flags.subtitle,
    sound: flags.sound ?? "Glass",
    noSound: flags.noSound,
  };

  sendNotification(options);

  process.stdout.write(
    "\n[claudify] Test notification sent.\n" +
    "           If nothing appeared, check:\n" +
    "           System Settings → Notifications → <your terminal app> → Allow Notifications: On\n"
  );
}

function cmdSounds(): void {
  const platform = detectPlatform();
  if (!platform) {
    process.stderr.write(`[claudify] Unsupported platform: ${process.platform}\n`);
    process.exit(1);
  }
  printSounds(platform);
}

function cmdInstall(rest: string[]): void {
  const scopeArg = getRest(rest, "--scope") ?? "user";
  const eventsArg = getRest(rest, "--events") ?? "Stop,TaskCompleted";
  const force = getRestFlag(rest, "--force");

  const VALID_EVENTS = new Set([
    "Stop", "TaskCompleted", "Notification", "PostToolUse", "PostToolUseFailure",
  ]);

  const events = eventsArg
    .split(",")
    .map((e) => e.trim())
    .filter((e) => {
      if (!e) return false;
      if (!VALID_EVENTS.has(e)) {
        process.stderr.write(`[claudify] Unknown event "${e}" — skipping.\n`);
        return false;
      }
      return true;
    });

  if (events.length === 0) {
    process.stderr.write("[claudify] No valid events to install.\n");
    process.exit(1);
  }

  const settingsPath = resolveSettingsPath(scopeArg);
  const settings = readSettingsJson(settingsPath);

  const hooks = settings["hooks"] as Record<string, unknown[]> ?? {};

  for (const event of events) {
    const existing = hooks[event] as Array<{ hooks?: Array<{ command?: string }> }> | undefined;
    const alreadyInstalled = existing?.some((group) =>
      group.hooks?.some((h) => h.command === "claudify")
    );

    if (alreadyInstalled && !force) {
      process.stderr.write(`[claudify] "${event}" already has claudify hook — skipping (use --force to overwrite).\n`);
      continue;
    }

    const entry = { hooks: [{ type: "command", command: "claudify", async: true }] };

    if (alreadyInstalled && force) {
      hooks[event] = (existing ?? []).map((group) => {
        const filtered = (group.hooks ?? []).filter((h) => h.command !== "claudify");
        return { ...group, hooks: [...filtered, { type: "command", command: "claudify", async: true }] };
      });
    } else {
      hooks[event] = [...(existing ?? []), entry];
    }

    process.stdout.write(`[claudify] Installed hook for "${event}".\n`);
  }

  settings["hooks"] = hooks;
  writeSettingsJson(settingsPath, settings);
  process.stdout.write(`[claudify] Written to ${settingsPath}\n`);
}

function resolveSettingsPath(scope: string): string {
  switch (scope) {
    case "user":
      return join(homedir(), ".claude", "settings.json");
    case "project":
      return join(process.cwd(), ".claude", "settings.json");
    case "local":
      return join(process.cwd(), ".claude", "settings.local.json");
    default:
      process.stderr.write(`[claudify] Unknown scope "${scope}". Use user, project, or local.\n`);
      process.exit(1);
  }
}

function readSettingsJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    process.stderr.write(`[claudify] settings.json at ${filePath} contains invalid JSON.\n`);
    process.exit(1);
  }
}

function writeSettingsJson(filePath: string, data: Record<string, unknown>): void {
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  } catch (err) {
    process.stderr.write(`[claudify] Failed to write ${filePath}: ${String(err)}\n`);
    process.exit(1);
  }
}

// --- Main ---

const { subcommand, flags, rest } = parseFlags(process.argv);

switch (subcommand) {
  case "init":
    cmdInit();
    break;
  case "test":
    cmdTest(flags);
    break;
  case "sounds":
    cmdSounds();
    break;
  case "install":
    cmdInstall(rest);
    break;
  default: {
    const hookInput = readHookInput();
    const eventName = hookInput.hook_event_name;

    if (!eventName) process.exit(0);

    const { options, enabled } = resolveOptions(eventName, flags);

    if (!enabled) process.exit(0);

    const notifyOptions: NotifyOptions = {
      title: applyTemplate(options.title ?? "Claude Code", hookInput),
      message: applyTemplate(options.message ?? "", hookInput),
      subtitle: options.subtitle ? applyTemplate(options.subtitle, hookInput) : undefined,
      sound: options.sound,
      noSound: options.noSound,
    };

    sendNotification(notifyOptions);
  }
}
