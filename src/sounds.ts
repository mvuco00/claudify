import { type Platform } from "./types.js";

const SOUNDS: Record<Platform, string[]> = {
  macos: [
    "Basso",
    "Blow",
    "Bottle",
    "Frog",
    "Funk",
    "Glass",
    "Hero",
    "Morse",
    "Ping",
    "Pop",
    "Purr",
    "Sosumi",
    "Submarine",
    "Tink",
  ],
  linux: [
    "bell",
    "complete",
    "dialog-error",
    "dialog-information",
    "dialog-warning",
    "message",
    "phone-incoming-call",
    "service-login",
    "service-logout",
  ],
  windows: [
    "Default",
    "Asterisk",
    "Exclamation",
    "Hand",
    "Question",
  ],
};

export function getSoundsForPlatform(platform: Platform): string[] {
  return SOUNDS[platform] ?? [];
}

export function printSounds(platform: Platform): void {
  const sounds = getSoundsForPlatform(platform);
  process.stdout.write(`Available sounds on ${platform}:\n\n`);
  for (const sound of sounds) {
    process.stdout.write(`  ${sound}\n`);
  }
}
