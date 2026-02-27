# claudify

Desktop notifications for [Claude Code](https://claude.ai/code) hooks. Supports macOS, Linux, and Windows.

## Installation

```sh
npm install -g claudify  # install
claudify install         # add hooks to Claude Code
claudify test            # verify it's working
```

That's all you need. Notifications will fire automatically from now on.

**Optional — customize titles, messages, and sounds:**

```sh
claudify init            # creates ~/.config/claudify/config.json
```

Open the generated file, edit whatever you want, and save. Changes take effect immediately.

## How It Works

Claude Code fires hook events (e.g. `Stop`, `TaskCompleted`) and pipes a JSON payload to any registered command. `claudify` reads that payload, resolves your config, and sends a native desktop notification.

## Commands

| Command | Description |
|---|---|
| `claudify install` | Add hooks to `~/.claude/settings.json` |
| `claudify uninstall` | Remove claudify hooks from `~/.claude/settings.json` |
| `claudify status` | Show installed hooks, active config file, and disable state |
| `claudify test` | Send a test notification |
| `claudify init` | Create a config file at `~/.config/claudify/config.json` |
| `claudify sounds` | List available sounds for your platform |

### `install` / `uninstall` options

| Flag | Default | Description |
|---|---|---|
| `--scope user` | ✓ | `~/.claude/settings.json` |
| `--scope project` | | `.claude/settings.json` (shared, committed) |
| `--scope local` | | `.claude/settings.local.json` (gitignored) |
| `--events <csv>` | `Stop,TaskCompleted` | Which events to add or remove |
| `--force` | | Overwrite existing claudify hooks (install only) |

### `init` options

| Flag | Description |
|---|---|
| `--force` | Overwrite existing config file with fresh defaults |

## Configuration

Configuration is optional — claudify works out of the box with sensible defaults.
To customize, run `claudify init` to generate a config file, then edit it:

```json
{
  "$schema": "https://unpkg.com/claudify/schema.json",
  "defaults": {
    "sound": "Glass"
  },
  "events": {
    "Stop": {
      "title": "Claude Code — {{project_name}}",
      "message": "{{last_assistant_message|Task completed}}",
      "sound": "Glass"
    },
    "TaskCompleted": {
      "title": "Claude Code",
      "message": "{{task_subject}} completed",
      "sound": "Glass"
    },
    "Notification": {
      "title": "{{title|Claude is waiting...}}",
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

1. `$CLAUDIFY_CONFIG` env var (must point to an existing file)
2. `.claudify.json` in the project directory (per-project config)
3. `~/.config/claudify/config.json`
4. `~/.claudify.json`

A `.claudify.json` in your project directory takes precedence over the global config, so teams can commit project-specific notification settings alongside their code.

### Environment variables

| Variable | Description |
|---|---|
| `$CLAUDIFY_CONFIG` | Path to a custom config file |
| `$CLAUDIFY_DISABLE=1` | Silence all notifications without uninstalling hooks |

`CLAUDIFY_DISABLE` is useful during meetings, in CI, or any time you want to temporarily mute notifications without touching your settings.

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
| `{{last_assistant_message}}` | Stop — truncated to 100 chars, newlines stripped |

Unknown variables render as empty string. Use `{{variable|fallback}}` to provide a default when a variable is empty:

```json
"title": "{{title|Claude is waiting...}}"
```

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

Hooks run with `async: true` — errors are invisible from Claude Code's perspective. Start by running:

```sh
claudify status   # check what's installed and which config is active
claudify test     # verify the notification pipeline works end to end
```

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
