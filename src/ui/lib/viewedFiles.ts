import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { DiffFile } from "../../core/types";

export interface ViewedFileRecord {
  path: string;
  patchHash: string;
  viewedAt: string;
}

export type ViewedFilesByPath = Record<string, ViewedFileRecord>;

interface PersistedViewedFiles {
  version: 1;
  reviewKeyHash: string;
  viewedFiles: ViewedFilesByPath;
  updatedAt: string;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildViewedFilesReviewKey({
  cwd,
  sourceLabel,
  title,
}: {
  cwd: string;
  sourceLabel: string;
  title: string;
}) {
  return [cwd, sourceLabel, title].join("\n");
}

export function viewedFilesStoragePath(reviewKey: string) {
  const reviewKeyHash = sha256(reviewKey).slice(0, 32);
  return join(homedir(), ".config", "hunk", "viewed-files", `${reviewKeyHash}.json`);
}

export function filePatchHash(file: DiffFile) {
  return sha256(
    JSON.stringify({
      path: file.path,
      previousPath: file.previousPath ?? null,
      patch: file.patch,
      additions: file.stats.additions,
      deletions: file.stats.deletions,
      hunks: file.metadata.hunks.map((hunk) => ({
        deletionStart: hunk.deletionStart,
        deletionLines: hunk.deletionLines,
        additionStart: hunk.additionStart,
        additionLines: hunk.additionLines,
        hunkContent: hunk.hunkContent,
      })),
      type: file.metadata.type,
      isBinary: file.isBinary ?? false,
      isTooLarge: file.isTooLarge ?? false,
    }),
  );
}

export function loadViewedFiles(reviewKey: string | undefined): ViewedFilesByPath {
  if (!reviewKey) {
    return {};
  }

  try {
    const payload = JSON.parse(readFileSync(viewedFilesStoragePath(reviewKey), "utf8"));
    if (!payload || payload.version !== 1 || typeof payload.viewedFiles !== "object") {
      return {};
    }

    return payload.viewedFiles as ViewedFilesByPath;
  } catch {
    return {};
  }
}

export function saveViewedFiles(reviewKey: string | undefined, viewedFiles: ViewedFilesByPath) {
  if (!reviewKey) {
    return;
  }

  const filePath = viewedFilesStoragePath(reviewKey);
  mkdirSync(dirname(filePath), { recursive: true });
  const payload: PersistedViewedFiles = {
    version: 1,
    reviewKeyHash: sha256(reviewKey).slice(0, 32),
    viewedFiles,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function currentViewedFilePaths(files: DiffFile[], viewedFiles: ViewedFilesByPath) {
  const paths = new Set<string>();
  for (const file of files) {
    const record = viewedFiles[file.path];
    if (record?.patchHash === filePatchHash(file)) {
      paths.add(file.path);
    }
  }
  return paths;
}
