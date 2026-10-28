import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupError,
  backupFileName,
  createBackup,
  downloadBackup,
  mergeById,
  parseBackup,
  projectsWithMissingStructure,
  serializeBackup,
} from "./backup";
import { buildCustomStructure, buildProject, readBlobAsText } from "../test/fixtures";

// A minimal valid backup file as text; tests tweak it before parsing.
const envelope = (patch: Record<string, unknown> = {}) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: "2026-10-10T05:30:00.000Z",
    data: { projects: [], customStructures: [] },
    ...patch,
  });

const errorMessage = (text: string): string => {
  try {
    parseBackup(text);
  } catch (error) {
    expect(error).toBeInstanceOf(BackupError);
    return (error as Error).message;
  }
  throw new Error("parseBackup did not throw");
};

const parseProject = (raw: Record<string, unknown>) =>
  parseBackup(envelope({ data: { projects: [raw] } })).data.projects[0];

describe("createBackup / serializeBackup / backupFileName", () => {
  it("wraps the data in the backup envelope", () => {
    const project = buildProject();
    const structure = buildCustomStructure();
    const backup = createBackup([project], [structure], new Date("2026-10-10T05:30:00.000Z"));
    expect(backup).toEqual({
      format: "authors-workbench-backup",
      version: BACKUP_VERSION,
      exportedAt: "2026-10-10T05:30:00.000Z",
      data: { projects: [project], customStructures: [structure] },
    });
  });

  it("round-trips through JSON, including non-ASCII text", () => {
    const original = createBackup(
      [buildProject({ title: "雾都孤儿 ✓" }), buildProject({ id: "p2" })],
      [buildCustomStructure()],
      new Date("2026-10-10T05:30:00.000Z")
    );
    const text = serializeBackup(original);
    expect(text).toContain("\n  "); // pretty-printed
    expect(parseBackup(text)).toEqual(original);
  });

  it("names the file with the zero-padded local date and time", () => {
    expect(backupFileName(new Date(2026, 9, 10, 15, 30))).toBe("authors-workbench-backup-2026-10-10-1530.json");
    expect(backupFileName(new Date(2026, 0, 5, 7, 3))).toBe("authors-workbench-backup-2026-01-05-0703.json");
  });
});

describe("downloadBackup", () => {
  let createObjectURL: jest.Mock<(blob: Blob) => string>;
  let revokeObjectURL: jest.Mock<(url: string) => void>;
  let clickSpy: ReturnType<typeof jest.spyOn>;
  let clicked: { href: string; download: string } | null;

  beforeEach(() => {
    clicked = null;
    createObjectURL = jest.fn(() => "blob:fake-url");
    revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked = { href: this.href, download: this.download };
    });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    jest.useRealTimers();
  });

  it("downloads a named JSON file and cleans up the temporary link", async () => {
    const backup = createBackup([buildProject()], [], new Date(2026, 9, 10, 15, 30));
    downloadBackup(backup);

    expect(clicked).toEqual({ href: "blob:fake-url", download: "authors-workbench-backup-2026-10-10-1530.json" });
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/json");
    expect(JSON.parse(await readBlobAsText(blob))).toEqual(backup);
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("frees the blob URL after one second", () => {
    jest.useFakeTimers();
    downloadBackup(createBackup([], []));
    expect(revokeObjectURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});

describe("parseBackup: accepted files", () => {
  it("accepts a BOM, an empty backup, and a missing customStructures list", () => {
    expect(() => parseBackup("\uFEFF" + envelope())).not.toThrow();
    const parsed = parseBackup(envelope({ data: { projects: [] } }));
    expect(parsed.data).toEqual({ projects: [], customStructures: [] });
  });

  it("keeps unknown extra fields (forward compatibility)", () => {
    const raw = { ...buildProject(), futureField: { a: 1 } };
    const project = parseProject(raw) as unknown as Record<string, unknown>;
    expect(project.futureField).toEqual({ a: 1 });
  });
});

describe("parseBackup: rejected files", () => {
  it("rejects text that is not JSON", () => {
    for (const text of ["hello", "", '{"format": "authors-workbench-backup", ']) {
      expect(errorMessage(text)).toMatch(/not valid JSON/);
    }
  });

  it("rejects JSON that is not an Author's Workbench backup", () => {
    const wrong = ["[]", "null", '"text"', envelope({ format: "other" }), JSON.stringify({ version: 1, data: { projects: [] } })];
    for (const text of wrong) {
      expect(errorMessage(text)).toMatch(/doesn't look like an Author's Workbench backup/);
    }
  });

  it("rejects a missing or invalid version, and a newer one with a clear message", () => {
    for (const version of [undefined, 0, -1, 1.5, "1"]) {
      const text = JSON.stringify({ format: BACKUP_FORMAT, version, data: { projects: [] } });
      expect(errorMessage(text)).toMatch(/no valid version number/);
    }
    const message = errorMessage(envelope({ version: BACKUP_VERSION + 1 }));
    expect(message).toMatch(/newer version of the app/);
    expect(message).toContain(`v${BACKUP_VERSION + 1}`);
  });

  it("rejects a backup without a list of projects", () => {
    for (const data of [undefined, "x", { customStructures: [] }, { projects: {} }]) {
      expect(errorMessage(envelope({ data }))).toMatch(/missing its list of projects/);
    }
  });

  it("rejects projects that are not objects or have no id", () => {
    const noId: Record<string, unknown> = { ...buildProject() };
    delete noId.id;
    expect(errorMessage(envelope({ data: { projects: [noId] } }))).toBe("projects[0] has no id.");
    expect(errorMessage(envelope({ data: { projects: [buildProject({ id: "" })] } }))).toMatch(/has no id/);
    expect(errorMessage(envelope({ data: { projects: ["oops"] } }))).toBe("projects[0] is not a valid record.");
  });

  it("names the project and the field when a nested list is broken", () => {
    const broken = { ...buildProject({ title: "Broken Book" }), chapters: "nope" };
    expect(errorMessage(envelope({ data: { projects: [broken] } }))).toBe("Project “Broken Book” → chapters must be a list.");

    const project = buildProject();
    const chapters = [...project.chapters];
    chapters[2] = { ...chapters[2], id: undefined as unknown as string };
    expect(errorMessage(envelope({ data: { projects: [{ ...project, chapters }] } }))).toBe(
      "Project “Test Novel” → chapters[2] has no id."
    );
  });

  it("rejects duplicate project ids and duplicate structure ids", () => {
    const projects = [buildProject(), buildProject({ title: "Copy" })];
    expect(errorMessage(envelope({ data: { projects } }))).toMatch(/two projects with the same id \(“p1”\)/);

    const customStructures = [buildCustomStructure(), buildCustomStructure()];
    expect(errorMessage(envelope({ data: { projects: [], customStructures } }))).toMatch(/two story structures with the same id/);
  });
});

describe("parseBackup: filling in incomplete data", () => {
  it("gives a project that only has an id sensible defaults", () => {
    expect(parseProject({ id: "x" })).toMatchObject({
      id: "x",
      title: "Untitled Story",
      targetWordCount: 0,
      averageChapterLength: 0,
      storyStructure: "three-act",
      storyStructureNotes: {},
      chapters: [],
      characters: [],
      locations: [],
      events: [],
      scenes: [],
    });
  });

  it("falls back for timestamps and wrong-typed values", () => {
    const withCreated = parseProject({ id: "x", createdAt: 123 });
    expect([withCreated.createdAt, withCreated.updatedAt, withCreated.lastOpenedAt]).toEqual([123, 123, 123]);

    const wrong = parseProject({ id: "x", title: 42, targetWordCount: "60000", averageChapterLength: NaN, createdAt: "yesterday", storyStructure: "" });
    expect(wrong).toMatchObject({ title: "Untitled Story", targetWordCount: 0, averageChapterLength: 0, storyStructure: "three-act" });
    expect(typeof wrong.createdAt).toBe("number");
  });

  it("numbers chapters, names characters and locations, and repairs dates", () => {
    const project = parseProject({
      id: "x",
      chapters: [{ id: "a" }, { id: "b" }],
      characters: [{ id: "c1" }, { id: "c2", birthday: { year: "1990" } }, { id: "c3", birthday: { year: 1990, month: 5, day: "x" } }],
      locations: [{ id: "l" }],
    });
    expect(project.chapters.map((c) => [c.order, c.title])).toEqual([[0, "Chapter 1"], [1, "Chapter 2"]]);
    expect(project.characters[0].name).toBe("Unnamed character");
    expect(project.locations[0].name).toBe("Unnamed location");
    expect(project.characters.map((c) => c.birthday)).toEqual([{ year: 0 }, { year: 0 }, { year: 1990, month: 5 }]);
  });

  it("normalizes events and scenes", () => {
    const project = parseProject({
      id: "x",
      events: [{ id: "e", chapterIds: ["a", 7, null, "b"], isStoryBeat: "yes" }],
      scenes: [{ id: "s" }],
    });
    expect(project.events[0]).toMatchObject({
      title: "Untitled event",
      chapterIds: ["a", "b"], // non-string ids dropped
      isStoryBeat: false, // only a real boolean true counts
      startDate: { year: 0 },
    });
    expect(project.scenes[0]).toMatchObject({ title: "Untitled scene", chapterIds: [], date: { year: 0 } });
  });

  it("always marks imported structures as custom", () => {
    const parsed = parseBackup(envelope({ data: { projects: [], customStructures: [{ id: "s", isCustom: false }] } }));
    expect(parsed.data.customStructures[0]).toMatchObject({ name: "Untitled structure", isCustom: true, acts: [], storyBeats: [] });
  });
});

describe("mergeById / projectsWithMissingStructure", () => {
  it("merges by id: incoming wins, nothing is deleted, inputs are not mutated", () => {
    const a = { id: "a", v: 1 };
    const b = { id: "b", v: 1 };
    const newerA = { id: "a", v: 2 };
    const existing = [a, b];

    expect(mergeById(existing, [newerA, { id: "c", v: 1 }])).toEqual([newerA, b, { id: "c", v: 1 }]);
    expect(mergeById(existing, [])).toEqual([a, b]);
    expect(mergeById([], [])).toEqual([]);
    expect(existing).toEqual([a, b]);
  });

  it("finds projects whose story structure does not exist", () => {
    const builtIn = ["three-act", "heros-journey", "save-the-cat"].map((id, i) => buildProject({ id: `p${i}`, storyStructure: id }));
    const usesCustom = buildProject({ id: "c", storyStructure: "custom-1" });
    const lost = buildProject({ id: "lost", storyStructure: "custom-gone" });

    expect(projectsWithMissingStructure([...builtIn, usesCustom], [buildCustomStructure()])).toEqual([]);
    expect(projectsWithMissingStructure([...builtIn, usesCustom, lost], [buildCustomStructure()])).toEqual([lost]);
  });
});