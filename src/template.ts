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
    last_assistant_message: input.last_assistant_message ?? "",
    tool_name: input.tool_name ?? "",
    error: input.error ?? "",
  };
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
  // Single-pass replacement — prevents double substitution
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
