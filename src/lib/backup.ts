// Backup & restore: turns the app's data into a single JSON file and back.
//
// Backed up everything the app persists in IndexedDB:
//   - every writing project (chapters, characters, locations, events, scenes, notes)
//   - every custom story structure template
//   - the author profile and the notebook signature
// UI state (open project, active view) is not part of a backup.


import type {
  Chapter,
  Character,
  Location,
  StoryDate,
  StoryEvent,
  StoryScene,
  WritingProject,
} from "./domain";
import {
  DEFAULT_STORY_STRUCTURE_ID,
  STORY_STRUCTURE_OPTIONS,
} from "../features/story-structure/storyStructureTemplate";
import type {
  StoryAct,
  StoryBeat,
  StoryStructureTemplate,
} from "../features/story-structure/storyStructureTemplate";

export const BACKUP_FORMAT = "authors-workbench-backup";
export const BACKUP_VERSION = 2;

// "merge"   -> add the backup's records without deletong anything; a record with the same id is overwritten.
// "replace" -> the backup's records replace every thing, current data is removed
export type ImportMode = "merge" | "replace";

export interface BackupProfile {
  displayName: string;
  penName: string;
  bio: string;
  avatarUrl: string | null;
  avatarDataUrl?: string | null;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string; // ISO date string
  data: {
    projects: WritingProject[];
    customStructures: StoryStructureTemplate[];
    // Optional so version 1 backups (which predate these fields) remain importable.
    profile?: BackupProfile | null;
    notebook?: string | null;
  };
}

// Throw message of anything wrong with a backup file for the user.
export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupError";
  }
}




/* ---------- Export ---------- */


// Wraps the current data in the backup envelope.
export function createBackup(
  projects: WritingProject[],
  customStructures: StoryStructureTemplate[],
  now: Date = new Date(),
  profile?: BackupProfile | null,
  notebook?: string | null
): BackupFile {
  const data: BackupFile["data"] = { projects, customStructures };
  if (profile !== undefined) data.profile = profile;
  if (notebook !== undefined) data.notebook = notebook;

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

export function serializeBackup(backup: BackupFile): string {
  // Pretty-printed so the file is readable.
  return JSON.stringify(backup, null, 2);
}

// Define format of the file's default name (e.g. authors-workbench-backup-2026-10-10-1530.json).
export function backupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `authors-workbench-backup-${day}-${time}.json`;
}

// Makes the browser download the backup as a .json file.
export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([serializeBackup(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName(new Date(backup.exportedAt));
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}



/* ---------------- Import: parse + validate + normalize -----------------------*/


const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;

// Keeps every field found in the file and then applies the validated/defaulted values on top.
function withOverrides<T>(raw: Record<string, unknown>, overrides: Partial<T>): T {
  return { ...raw, ...overrides } as unknown as T;
}

// A record must be an object with a non-empty string id, because ids are IndexedDB keys.
function requireRecord(raw: unknown, path: string): Record<string, unknown> & { id: string } {
  if (!isRecord(raw)) throw new BackupError(`${path} is not a valid record.`);
  if (typeof raw.id !== "string" || raw.id === "") {
    throw new BackupError(`${path} has no id.`);
  }
  return raw as Record<string, unknown> & { id: string };
}

// Missing list -> empty list. Present but not a list -> the file is broken.
function readList<T>(
  value: unknown,
  path: string,
  normalize: (item: unknown, itemPath: string, index: number) => T
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BackupError(`${path} must be a list.`);
  return value.map((item, index) => normalize(item, `${path}[${index}]`, index));
}

// A missing date becomes { year: 0 } as same as that on ChapterPage.
function readStoryDate(value: unknown): StoryDate {
  if (!isRecord(value) || typeof value.year !== "number" || !Number.isFinite(value.year)) {
    return { year: 0 };
  }
  const date: StoryDate = { year: value.year };
  if (typeof value.month === "number") date.month = value.month;
  if (typeof value.day === "number") date.day = value.day;
  return date;
}

function normalizeChapter(raw: unknown, path: string, index: number): Chapter {
  const rec = requireRecord(raw, path);
  return withOverrides<Chapter>(rec, {
    id: rec.id,
    order: asNumber(rec.order, index),
    title: asString(rec.title, `Chapter ${index + 1}`),
    targetWordCount: asNumber(rec.targetWordCount),
    actualWordCount: asNumber(rec.actualWordCount),
    notes: asString(rec.notes),
  });
}

function normalizeCharacter(raw: unknown, path: string): Character {
  const rec = requireRecord(raw, path);
  return withOverrides<Character>(rec, {
    id: rec.id,
    name: asString(rec.name, "Unnamed character"),
    birthday: readStoryDate(rec.birthday),
  });
}

function normalizeLocation(raw: unknown, path: string): Location {
  const rec = requireRecord(raw, path);
  return withOverrides<Location>(rec, {
    id: rec.id,
    name: asString(rec.name, "Unnamed location"),
  });
}

function normalizeEvent(raw: unknown, path: string): StoryEvent {
  const rec = requireRecord(raw, path);
  return withOverrides<StoryEvent>(rec, {
    id: rec.id,
    title: asString(rec.title, "Untitled event"),
    description: asString(rec.description),
    chapterIds: asStringArray(rec.chapterIds) ?? [],
    startDate: readStoryDate(rec.startDate),
    endDate: readStoryDate(rec.endDate),
    isStoryBeat: rec.isStoryBeat === true,
  });
}

function normalizeScene(raw: unknown, path: string): StoryScene {
  const rec = requireRecord(raw, path);
  return withOverrides<StoryScene>(rec, {
    id: rec.id,
    title: asString(rec.title, "Untitled scene"),
    description: asString(rec.description),
    chapterIds: asStringArray(rec.chapterIds) ?? [],
    date: readStoryDate(rec.date),
  });
}

function normalizeProject(raw: unknown, path: string): WritingProject {
  const rec = requireRecord(raw, path);
  // Use the project's title in error messages so the user can find the problem.
  const label = `Project “${asString(rec.title, rec.id)}”`;
  const createdAt = asNumber(rec.createdAt, Date.now());

  return withOverrides<WritingProject>(rec, {
    id: rec.id,
    title: asString(rec.title, "Untitled Story"),
    targetWordCount: asNumber(rec.targetWordCount),
    averageChapterLength: asNumber(rec.averageChapterLength),
    storyStructure: asString(rec.storyStructure) || DEFAULT_STORY_STRUCTURE_ID,
    storyStructureNotes: isRecord(rec.storyStructureNotes)
      ? (rec.storyStructureNotes as WritingProject["storyStructureNotes"])
      : {},
    chapters: readList(rec.chapters, `${label} → chapters`, normalizeChapter),
    characters: readList(rec.characters, `${label} → characters`, normalizeCharacter),
    locations: readList(rec.locations, `${label} → locations`, normalizeLocation),
    events: readList(rec.events, `${label} → events`, normalizeEvent),
    scenes: readList(rec.scenes, `${label} → scenes`, normalizeScene),
    createdAt,
    updatedAt: asNumber(rec.updatedAt, createdAt),
    lastOpenedAt: asNumber(rec.lastOpenedAt, createdAt),
  });
}

function normalizeAct(raw: unknown, path: string): StoryAct {
  const rec = requireRecord(raw, path);
  return withOverrides<StoryAct>(rec, {
    id: rec.id,
    name: asString(rec.name),
    startPercent: asNumber(rec.startPercent),
    endPercent: asNumber(rec.endPercent),
  });
}

function normalizeBeat(raw: unknown, path: string): StoryBeat {
  const rec = requireRecord(raw, path);
  return withOverrides<StoryBeat>(rec, {
    id: rec.id,
    name: asString(rec.name),
    startPercent: asNumber(rec.startPercent),
    endPercent: asNumber(rec.endPercent),
  });
}

function normalizeStructure(raw: unknown, path: string): StoryStructureTemplate {
  const rec = requireRecord(raw, path);
  const label = `Story structure “${asString(rec.name, rec.id)}”`;
  return withOverrides<StoryStructureTemplate>(rec, {
    id: rec.id,
    name: asString(rec.name, "Untitled structure"),
    description: asString(rec.description),
    acts: readList(rec.acts, `${label} → acts`, normalizeAct),
    storyBeats: readList(rec.storyBeats, `${label} → storyBeats`, normalizeBeat),
    // Everything in this list is a custom structure by definition.
    isCustom: true,
  });
}

function normalizeProfile(raw: unknown, path: string): BackupProfile {
  if (!isRecord(raw)) throw new BackupError(`${path} must be an object.`);

  if (
    raw.avatarDataUrl !== undefined &&
    raw.avatarDataUrl !== null &&
    typeof raw.avatarDataUrl !== "string"
  ) {
    throw new BackupError(`${path}.avatarDataUrl must be text or null.`);
  }

  const avatarUrl =
    raw.avatarUrl === null || typeof raw.avatarUrl === "string" ? raw.avatarUrl : null;

  const profile: BackupProfile = {
    displayName: asString(raw.displayName),
    penName: asString(raw.penName),
    bio: asString(raw.bio),
    avatarUrl,
  };

  if (raw.avatarDataUrl === null || typeof raw.avatarDataUrl === "string") {
    profile.avatarDataUrl = raw.avatarDataUrl;
  }

  return withOverrides<BackupProfile>(raw, profile);
}

// Throw if any two items share the same id.
function assertUniqueIds(items: { id: string }[], what: string): void {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) throw new BackupError(`The file contains two ${what} with the same id (“${id}”).`);
    seen.add(id);
  }
}

// Reads the text of a backup file and returns data.
// Throws BackupError with a readable message if the file can't be used.
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    // A byte-order mark added by some editors would make JSON.parse fail.
    raw = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new BackupError("This file is not valid JSON, so it can't be a backup.");
  }

  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT) {
    throw new BackupError("This doesn't look like an Author's Workbench backup file.");
  }

  const version = raw.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new BackupError("This backup has no valid version number.");
  }
  if (version > BACKUP_VERSION) {
    throw new BackupError(
      `This backup was made by a newer version of the app (backup format v${version}). ` +
        `Please update the app before restoring it.`
    );
  }


  // Parse backup file: verify structure, normalize data, ensure id uniqueness, 
  // and then return standardized object.
  const data = raw.data;
  if (!isRecord(data) || !Array.isArray(data.projects)) {
    throw new BackupError("This backup is missing its list of projects.");
  }

  const projects = readList(data.projects, "projects", normalizeProject);
  const customStructures = readList(data.customStructures, "customStructures", normalizeStructure);
  const normalizedData: BackupFile["data"] = { projects, customStructures };

  if (Object.prototype.hasOwnProperty.call(data, "profile")) {
    normalizedData.profile =
      data.profile === null ? null : normalizeProfile(data.profile, "profile");
  }
  if (Object.prototype.hasOwnProperty.call(data, "notebook")) {
    if (data.notebook !== null && typeof data.notebook !== "string") {
      throw new BackupError("notebook must be text or null.");
    }
    normalizedData.notebook = data.notebook as string | null;
  }

  assertUniqueIds(projects, "projects");
  assertUniqueIds(customStructures, "story structures");

  return {
    format: BACKUP_FORMAT,
    version,
    exportedAt: asString(raw.exportedAt),
    data: normalizedData,
  };
}


/* ------------------ Import: merge helpers ----------------------*/


// Combines two lists by id. Incoming records replace existing ones with the same id;
// existing records that aren't in the incoming list are kept.
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const merged = new Map<string, T>(existing.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

// Detects projects which have referenced the nonexistent story structure, 
// and falls back to the Three-Act template for them.
export function projectsWithMissingStructure(
  projects: WritingProject[],
  customStructures: StoryStructureTemplate[]
): WritingProject[] {
  const known = new Set<string>([
    ...STORY_STRUCTURE_OPTIONS.map((option) => option.id),
    ...customStructures.map((structure) => structure.id),
  ]);
  return projects.filter((project) => !known.has(project.storyStructure));
}
