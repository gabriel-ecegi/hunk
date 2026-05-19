import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveUserConfigDir } from "../../core/paths";
import { THEMES } from "../themes";

interface PersistedThemeState {
  version: 1;
  themeId: string;
  updatedAt: string;
}

const THEME_STATE_VERSION = 1;
const BUILT_IN_THEME_IDS = new Set(THEMES.map((theme) => theme.id));

export function themeStateStoragePath(env: NodeJS.ProcessEnv = process.env) {
  const configDir = resolveUserConfigDir(env);
  return configDir ? join(configDir, "hunk", "theme.json") : undefined;
}

export function isPersistableThemeId(themeId: string) {
  return BUILT_IN_THEME_IDS.has(themeId);
}

export function loadPersistedThemeId(env: NodeJS.ProcessEnv = process.env) {
  const filePath = themeStateStoragePath(env);
  if (!filePath) {
    return undefined;
  }

  try {
    const payload = JSON.parse(readFileSync(filePath, "utf8")) as Partial<PersistedThemeState>;
    if (payload.version !== THEME_STATE_VERSION || typeof payload.themeId !== "string") {
      return undefined;
    }

    return isPersistableThemeId(payload.themeId) ? payload.themeId : undefined;
  } catch {
    return undefined;
  }
}

export function savePersistedThemeId(themeId: string, env: NodeJS.ProcessEnv = process.env) {
  if (!isPersistableThemeId(themeId)) {
    return;
  }

  const filePath = themeStateStoragePath(env);
  if (!filePath) {
    return;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        version: THEME_STATE_VERSION,
        themeId,
        updatedAt: new Date().toISOString(),
      } satisfies PersistedThemeState,
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}
