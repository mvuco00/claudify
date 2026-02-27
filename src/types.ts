export type Platform = "macos" | "linux" | "windows";

export interface HookInput {
  hook_event_name: string;
  session_id?: string;
  cwd?: string;
  transcript_path?: string;
  permission_mode?: string;
  // Stop
  last_assistant_message?: string;
  stop_hook_active?: boolean;
  // TaskCompleted
  task_id?: string;
  task_subject?: string;
  task_description?: string;
  // Notification
  title?: string;
  message?: string;
  notification_type?: string;
  // PostToolUse / PostToolUseFailure
  tool_name?: string;
  tool_use_id?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  error?: string;
  is_interrupt?: boolean;
}

export interface NotifyOptions {
  title: string;
  message: string;
  subtitle?: string;
  sound?: string;
  noSound?: boolean;
}

export interface EventConfig {
  enabled?: boolean;
  title?: string;
  message?: string;
  subtitle?: string;
  sound?: string;
  noSound?: boolean;
}

export interface Config {
  defaults?: EventConfig;
  events?: Record<string, EventConfig>;
}

export type Notifier = (options: NotifyOptions) => void;

export interface CliFlags {
  title?: string;
  message?: string;
  subtitle?: string;
  sound?: string;
  noSound?: boolean;
}
