import { type HookInput } from "./types.js";

type TemplateVars = Record<string, string>;

function buildVars(input: HookInput): TemplateVars {
  const projectName = deriveProjectName(input.cwd);

  return {
    session_id: input.session_id ?? "",
    cwd: input.cwd ?? "",
    project_name: projectName,
    hook_event_name: input.hook_event_name ?? "",
    title: input.title ?? "",
    message: input.message ?? "",
    notification_type: input.notification_type ?? "",
    task_id: input.task_id ?? "",
    task_subject: input.task_subject ?? "",
    last_assistant_message: humanizeLastMessage(input.last_assistant_message ?? ""),
    tool_name: input.tool_name ?? "",
    error: input.error ?? "",
  };
}

function truncate(text: string, max: number): string {
  // Strip newlines so multi-line responses fit on one notification line
  const flat = text.replace(/\s*\n\s*/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

// Claude Code sends raw system strings in last_assistant_message.
// Map known ones to user-friendly equivalents.
const SYSTEM_STRING_MAP: Record<string, string> = {
  "waiting for input": "Waiting for your input",
  "awaiting input": "Waiting for your input",
};

function humanizeLastMessage(msg: string): string {
  if (!msg) return "";
  const normalized = msg.toLowerCase().trim();
  return SYSTEM_STRING_MAP[normalized] ?? truncate(msg, 100);
}

function deriveProjectName(cwd: string | undefined): string {
  if (!cwd) return "";
  const parts = cwd.replace(/\/+$/, "").split("/");
  const base = parts[parts.length - 1] ?? "";
  if (!base || base === "." || base === "tmp" || base === "/") return cwd;
  return base;
}

export function applyTemplate(template: string, input: HookInput): string {
  const vars = buildVars(input);
  // Supports {{variable}} and {{variable|fallback}} syntax.
  // Single-pass replacement — prevents double substitution.
  return template.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_, key, fallback) => {
    const value = vars[key] ?? "";
    return value !== "" ? value : (fallback ?? "");
  });
}
