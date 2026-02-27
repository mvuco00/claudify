import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type Config, type EventConfig, type CliFlags } from "./types.js";

const BUILTIN_DEFAULTS: EventConfig = {
  title: "Claude Code",
  message: "Task completed in {{project_name}}",
  sound: "Glass",
  enabled: true,
};

const BUILTIN_EVENTS: Record<string, EventConfig> = {
  Stop: {
    title: "Claude Code — {{project_name}}",
    message: "{{last_assistant_message|Task completed}}",
    sound: "Glass",
  },
  TaskCompleted: {
    title: "Claude Code",
    message: "{{task_subject}} completed",
    sound: "Glass",
  },
  Notification: {
    title: "{{title|Claude is waiting...}}",
    message: "{{message}}",
    sound: "Blow",
  },
  PostToolUse: {
    enabled: false,
  },
  PostToolUseFailure: {
    enabled: false,
    title: "Claude Code",
    message: "{{tool_name}} failed",
    sound: "Basso",
  },
};

function loadConfigFile(): Config | null {
  const candidates = configFileCandidates();

  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, "utf8");
      return JSON.parse(raw) as Config;
    } catch (err: unknown) {
      if (isNotFound(err)) continue;
      // File exists but is malformed — error loudly and stop
      process.stderr.write(
        `[claudify] Failed to parse config at ${filePath}: ${String(err)}\n`
      );
      process.exit(1);
    }
  }

  return null;
}

function configFileCandidates(): string[] {
  const envPath = process.env["CLAUDIFY_CONFIG"];
  if (envPath) {
    // Explicit path must exist — no fallback
    try {
      readFileSync(envPath);
    } catch {
      process.stderr.write(
        `[claudify] $CLAUDIFY_CONFIG points to a missing file: ${envPath}\n`
      );
      process.exit(1);
    }
    return [envPath];
  }

  const home = homedir();
  return [
    join(home, ".config", "claudify", "config.json"),
    join(home, ".claudify.json"),
  ];
}

function isNotFound(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export function resolveOptions(
  eventName: string,
  flags: CliFlags
): { options: EventConfig; enabled: boolean } {
  const fileConfig = loadConfigFile();
  const fileDefaults = fileConfig?.defaults ?? {};
  const fileEvent = fileConfig?.events?.[eventName] ?? {};
  const builtinEvent = BUILTIN_EVENTS[eventName] ?? {};

  // Precedence: built-in defaults → file defaults → built-in event → file event → CLI flags
  const merged: EventConfig = {
    ...BUILTIN_DEFAULTS,
    ...builtinEvent,
    ...fileDefaults,
    ...fileEvent,
    ...(flags.title !== undefined ? { title: flags.title } : {}),
    ...(flags.message !== undefined ? { message: flags.message } : {}),
    ...(flags.subtitle !== undefined ? { subtitle: flags.subtitle } : {}),
    ...(flags.sound !== undefined ? { sound: flags.sound } : {}),
    ...(flags.noSound !== undefined ? { noSound: flags.noSound } : {}),
  };

  const enabled = merged.enabled !== false;

  return { options: merged, enabled };
}

export function getDefaultConfig(): Config {
  return {
    defaults: {
      sound: "Glass",
    },
    events: BUILTIN_EVENTS,
  };
}
