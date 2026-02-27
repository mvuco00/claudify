# claudify

Desktop notifications for [Claude Code](https://claude.ai/code) hooks. Supports macOS, Linux, and Windows.

## Installation

```sh
npm install -g claudify
```

Then add hooks to your Claude Code settings:

```sh
claudify install
```

Verify it's working:

```sh
claudify test
```

## How It Works

Claude Code fires hook events (e.g. `Stop`, `TaskCompleted`) and pipes a JSON payload to any registered command. `claudify` reads that payload, resolves your config, and sends a native desktop notification.

## Commands

| Command | Description |
|---|---|
| `claudify install` | Add hooks to `~/.claude/settings.json` |
| `claudify test` | Send a test notification |
| `claudify init` | Create a config file at `~/.config/claudify/config.json` |
| `claudify sounds` | List available sounds for your platform |

### `install` options

| Flag | Default | Description |
|---|---|---|
| `--scope user` | ✓ | Write to `~/.claude/settings.json` |
| `--scope project` | | Write to `.claude/settings.json` (shared, committed) |
| `--scope local` | | Write to `.claude/settings.local.json` (gitignored) |
| `--events <csv>` | `Stop,TaskCompleted` | Which events to install hooks for |
| `--force` | | Overwrite existing claudify hooks |

## Configuration

Run `claudify init` to create a config file, then edit it:

```json
{
  "$schema": "https://unpkg.com/claudify/schema.json",
  "defaults": {
    "sound": "Glass"
  },
  "events": {
    "Stop": {
      "title": "Claude Code",
      "message": "Task completed in {{project_name}}",
      "sound": "Glass"
    },
    "TaskCompleted": {
      "title": "Claude Code",
      "message": "{{task_subject}} completed",
      "sound": "Glass"
    },
    "Notification": {
      "title": "{{title}}",
      "message": "{{message}}",
      "sound": "Blow"
    },
    "PostToolUseFailure": {
      "enabled": false,
      "title": "Claude Code",
      "message": "{{tool_name}} failed",
      "sound": "Basso"
    }
  }
}
```

The `$schema` field enables autocompletion in editors that support JSON Schema (VS Code, WebStorm, etc.).

### Config file locations

Searched in order — first found wins:

1. `$CLAUDIFY_CONFIG` env var
2. `~/.config/claudify/config.json`
3. `~/.claudify.json`

### Template variables

Use `{{variable}}` in `title`, `message`, and `subtitle` fields:

| Variable | Available in |
|---|---|
| `{{project_name}}` | All events |
| `{{cwd}}` | All events |
| `{{session_id}}` | All events |
| `{{task_subject}}` | TaskCompleted |
| `{{tool_name}}` | PostToolUse, PostToolUseFailure |
| `{{error}}` | PostToolUseFailure |
| `{{title}}` | Notification |
| `{{message}}` | Notification |
| `{{last_assistant_message}}` | Stop |

Unknown variables render as empty string.

### Inline overrides

Flags override config for a single invocation:

```sh
claudify --title "Done!" --sound Hero
```

| Flag | Description |
|---|---|
| `--title` | Notification title |
| `--message` | Notification message |
| `--subtitle` | Subtitle (macOS only) |
| `--sound` | Sound name |
| `--no-sound` | Suppress sound |

## Sounds

```sh
claudify sounds
```

**macOS:** Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink

**Linux:** Requires `notify-send` (`libnotify-bin` on Debian/Ubuntu).

**Windows:** Experimental. Requires PowerShell and Windows 10+.

## Troubleshooting

**No notification appears on macOS**

`osascript` exits silently when notification permission is denied. Fix:

> System Settings → Notifications → Terminal (or iTerm2) → Allow Notifications: On

Then run `claudify test` again.

**Hooks fire but nothing happens**

Hooks run with `async: true` — errors are invisible from Claude Code's perspective. Run `claudify test` directly in your terminal to diagnose.

## Local Development

```sh
git clone https://github.com/yourname/claudify
cd claudify
bun install
bun run build
npm link        # makes claudify available globally from your local build
claudify test
```

## License

MIT
