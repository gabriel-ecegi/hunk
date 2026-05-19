import { describe, expect, test } from "bun:test";
import { createTestDiffFile, lines } from "../../../test/helpers/diff-helpers";
import { currentViewedFilePaths, filePatchHash } from "./viewedFiles";

describe("viewed file helpers", () => {
  test("keeps viewed state only while the file patch is unchanged", () => {
    const original = {
      ...createTestDiffFile({
        id: "file",
        path: "src/file.ts",
        before: lines("export const value = 1;"),
        after: lines("export const value = 2;"),
      }),
      patch: "-export const value = 1;\n+export const value = 2;\n",
    };
    const changed = {
      ...createTestDiffFile({
        id: "file",
        path: "src/file.ts",
        before: lines("export const value = 1;"),
        after: lines("export const value = 3;"),
      }),
      patch: "-export const value = 1;\n+export const value = 3;\n",
    };

    const viewedFiles = {
      "src/file.ts": {
        path: "src/file.ts",
        patchHash: filePatchHash(original),
        viewedAt: "2026-05-19T00:00:00.000Z",
      },
    };

    expect(currentViewedFilePaths([original], viewedFiles)).toEqual(new Set(["src/file.ts"]));
    expect(currentViewedFilePaths([changed], viewedFiles)).toEqual(new Set());
  });
});
