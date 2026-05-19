import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isPersistableThemeId,
  loadPersistedThemeId,
  savePersistedThemeId,
  themeStateStoragePath,
} from "./themeState";

function createTempHome() {
  return mkdtempSync(join(tmpdir(), "hunk-theme-home-"));
}

describe("theme state persistence", () => {
  test("persists and reloads selected built-in themes", () => {
    const home = createTempHome();
    const env = { HOME: home } as NodeJS.ProcessEnv;

    try {
      savePersistedThemeId("paper", env);

      expect(loadPersistedThemeId(env)).toBe("paper");
      expect(JSON.parse(readFileSync(themeStateStoragePath(env)!, "utf8"))).toMatchObject({
        version: 1,
        themeId: "paper",
      });
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  test("ignores unknown and malformed persisted theme ids", () => {
    const home = createTempHome();
    const env = { HOME: home } as NodeJS.ProcessEnv;
    const filePath = themeStateStoragePath(env)!;

    try {
      mkdirSync(join(home, ".config", "hunk"), { recursive: true });
      writeFileSync(filePath, JSON.stringify({ version: 1, themeId: "unknown" }), "utf8");
      expect(loadPersistedThemeId(env)).toBeUndefined();

      writeFileSync(filePath, JSON.stringify({ version: 2, themeId: "paper" }), "utf8");
      expect(loadPersistedThemeId(env)).toBeUndefined();
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  test("does not write non-persistable virtual theme ids", () => {
    const home = createTempHome();
    const env = { HOME: home } as NodeJS.ProcessEnv;

    try {
      expect(isPersistableThemeId("auto")).toBe(false);
      savePersistedThemeId("auto", env);
      expect(existsSync(themeStateStoragePath(env)!)).toBe(false);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
