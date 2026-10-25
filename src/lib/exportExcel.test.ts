import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import ExcelJS from "exceljs";
import { ExportError, buildStructureWorkbook, exportStructureToExcel, structureFileName } from "./exportExcel";
import { buildCustomStructure, buildProject, readBlobAsBytes } from "../test/fixtures";
import { getBeatChapterRange } from "../features/story-structure/storyChapterMapping";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";
import type { WritingProject } from "./domain";
import type { StoryStructureTemplate } from "../features/story-structure/storyStructureTemplate";

// Builds the workbook, then reads it back the way Excel would.
async function loadSheet(project: WritingProject, structures: StoryStructureTemplate[] = []) {
  const buffer = await buildStructureWorkbook(project, structures);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return { workbook, sheet: workbook.getWorksheet("STRUCTURE")! };
}

// Plain text of a cell, including rich-text cells.
function textOf(cell: ExcelJS.Cell): string {
  const v = cell.value as unknown;
  if (v && typeof v === "object" && "richText" in (v as object)) {
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  return v === null || v === undefined ? "" : String(v);
}

const column = (sheet: ExcelJS.Worksheet, col: number, rows = [3, 4, 5, 6, 7, 8]) => rows.map((r) => sheet.getCell(r, col).value);

// With 6 chapters (rows 3-8): Setup = ch1, Confrontation = ch2-4, Resolution = ch5-6.

// Where each beat should land is taken from the app's own template and chapter mapping,
// so these tests keep working if the template percentages are tuned later.
const CHAPTER_COUNT = 6;
const threeAct = getStoryStructureOption("three-act");
const rowOfChapter = (chapter: number) => chapter + 2; // chapter 1 is on sheet row 3
const beatRows = (id: string) => {
  const beat = threeAct.storyBeats.find((b) => b.id === id)!;
  const range = getBeatChapterRange(beat, CHAPTER_COUNT);
  return { beat, firstRow: rowOfChapter(range.start), lastRow: rowOfChapter(range.end) };
};
const isPointBeat = (b: { startPercent: number; endPercent: number }) => b.startPercent === b.endPercent;

describe("buildStructureWorkbook: layout", () => {
  it("refuses a project with no chapters", async () => {
    const empty = buildProject({ chapters: [] });
    await expect(buildStructureWorkbook(empty, [])).rejects.toBeInstanceOf(ExportError);
    await expect(buildStructureWorkbook(empty, [])).rejects.toThrow(/no chapters yet/);
  });

  it("creates a real .xlsx with one frozen STRUCTURE sheet, titled and with the word goal", async () => {
    const bytes = new Uint8Array(await buildStructureWorkbook(buildProject(), []));
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");

    const { workbook, sheet } = await loadSheet(buildProject());
    expect(workbook.worksheets.map((s) => s.name)).toEqual(["STRUCTURE"]);
    expect(workbook.creator).toBe("Author's Workbench");
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 2 });
    expect(sheet.getCell("A1").value).toBe("THREE-ACT STRUCTURE");
    expect([sheet.getCell("B2").value, sheet.getCell("C2").value]).toEqual(["WORD GOAL", 12000]);
    expect(sheet.pageSetup).toMatchObject({ orientation: "landscape", fitToPage: true, fitToWidth: 1 });
  });

  it("writes headers, with a column only for characters who appear in chapters", async () => {
    const { sheet } = await loadSheet(buildProject());
    const headers = [4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => textOf(sheet.getCell(2, c)));
    expect(headers).toEqual(["Chapter", "POV", "Chapter Goal", "Cumulative", "% novel", "DESCRIPTION", "ALICE", "BOB", ""]);
  });

  it("writes one row per chapter, sorted by order, with notes and an empty POV", async () => {
    const base = buildProject();
    const shuffled = [base.chapters[2], base.chapters[0], base.chapters[1], ...base.chapters.slice(3)];
    const { sheet } = await loadSheet(buildProject({ chapters: shuffled }));

    expect(column(sheet, 4)).toEqual(["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5", "Chapter 6"]);
    expect(column(sheet, 5)).toEqual(Array(6).fill(null));
    expect(sheet.getCell("I3").value).toBe("Notes for chapter 1");
    expect(sheet.getCell("D9").value).toBeNull();
  });

  it("keeps accented text, line breaks and emoji, and uppercases character names", async () => {
    const chapters = buildProject().chapters.map((c, i) => (i === 0 ? { ...c, title: "Chapitre Éclair 🌫️", notes: "Première note\nSecond line" } : c));
    const characters = buildProject().characters.map((c) => (c.id === "c1" ? { ...c, name: "Alice Smith" } : c));
    const { sheet } = await loadSheet(buildProject({ chapters, characters }));
    expect(sheet.getCell("D3").value).toBe("Chapitre Éclair 🌫️");
    expect(sheet.getCell("I3").value).toBe("Première note\nSecond line");
    expect(sheet.getCell("J2").value).toBe("ALICE SMITH");
  });

  it("keeps row heights within Excel's 409-point limit", async () => {
    const chapters = buildProject().chapters.map((c, i) => (i === 0 ? { ...c, notes: "word ".repeat(5000) } : c));
    const { sheet } = await loadSheet(buildProject({ chapters }));
    expect(sheet.getRow(3).height).toBeLessThanOrEqual(409);
    expect(sheet.getRow(3).height).toBeGreaterThan(30);
    expect(sheet.getRow(4).height).toBeGreaterThanOrEqual(30);
  });

  it("exports a 100-chapter project", async () => {
    const chapters = Array.from({ length: 100 }, (_, i) => ({
      id: `c${i}`, order: i, title: `Chapter ${i + 1}`, targetWordCount: 1000, actualWordCount: 0, notes: "",
    }));
    const { sheet } = await loadSheet(buildProject({ chapters, targetWordCount: 100000, events: [], scenes: [] }));
    expect(sheet.getCell("D102").value).toBe("Chapter 100");
    expect((sheet.getCell("G102").value as { result: number }).result).toBe(100000);
  });
});

describe("buildStructureWorkbook: numbers and characters", () => {
  it("writes word goals, a running total and % of novel as formulas", async () => {
    const { sheet } = await loadSheet(buildProject());
    expect(column(sheet, 6)).toEqual(Array(6).fill(2000));
    expect(sheet.getCell("G3").value).toMatchObject({ formula: "F3", result: 2000 });
    expect(sheet.getCell("G8").value).toMatchObject({ formula: "F8+G7", result: 12000 });
    expect(sheet.getCell("H3").value).toMatchObject({ formula: 'IF($C$2>0,G3/$C$2,"")' });
    expect((sheet.getCell("H8").value as { result: number }).result).toBeCloseTo(1);
    expect([sheet.getCell("C2").numFmt, sheet.getCell("H3").numFmt]).toEqual(["#,##0", "0.0%"]);
  });

  it("treats a missing chapter goal as 0 and blanks % when the word goal is 0", async () => {
    const chapters = buildProject().chapters.map((c, i) => (i === 1 ? { ...c, targetWordCount: undefined as unknown as number } : c));
    const { sheet } = await loadSheet(buildProject({ chapters, targetWordCount: 0 }));
    expect(sheet.getCell("F4").value).toBe(0);
    expect((sheet.getCell("G4").value as { result: number }).result).toBe(2000);
    // exceljs drops an empty cached result on read-back, so check the formula and that no number is cached.
    const percent = sheet.getCell("H3").value as { formula: string; result?: unknown };
    expect(percent.formula).toContain("IF($C$2>0");
    expect(percent.result === undefined || percent.result === "").toBe(true);
  });

  it("marks characters TRUE in chapters where they appear (directly, via scenes, via events)", async () => {
    const { sheet } = await loadSheet(buildProject());
    expect(column(sheet, 10)).toEqual([true, false, true, false, false, false]); // Alice: ch1 + scene in ch3
    expect(column(sheet, 11)).toEqual([false, true, false, false, false, false]); // Bob: event in ch2
  });

  it("adds no character columns when nobody appears", async () => {
    const chapters = buildProject().chapters.map((c) => ({ ...c, characterIds: undefined }));
    const { sheet } = await loadSheet(buildProject({ chapters, events: [], scenes: [] }));
    expect(sheet.getCell("J2").value).toBeNull();
    expect(sheet.getCell("D3").value).toBe("Chapter 1");
  });
});

describe("buildStructureWorkbook: acts and beats", () => {
  it("writes each act once, merged across its chapters and rotated", async () => {
    const { sheet } = await loadSheet(buildProject());
    expect([sheet.getCell("A3").value, sheet.getCell("A4").value, sheet.getCell("A7").value]).toEqual(["SETUP", "CONFRONTATION", "RESOLUTION"]);
    expect([sheet.getCell("A5").master.address, sheet.getCell("A6").master.address, sheet.getCell("A8").master.address]).toEqual(["A4", "A4", "A7"]);
    expect(sheet.getCell("A3").isMerged).toBe(false);
    expect(sheet.getCell("A4").alignment?.textRotation).toBe(90);
  });

  it("puts every point beat in the beat column of the chapter it maps to", async () => {
    const { sheet } = await loadSheet(buildProject());
    const pointBeats = threeAct.storyBeats.filter(isPointBeat);
    expect(pointBeats.length).toBeGreaterThan(0);

    for (const beat of pointBeats) {
      const { firstRow } = beatRows(beat.id);
      expect(textOf(sheet.getCell(`C${firstRow}`))).toContain(beat.name.toUpperCase());
    }
  });

  it("shows in column B the range beat covering each chapter (the latest-starting one wins)", async () => {
    const { sheet } = await loadSheet(buildProject());
    const rangeBeats = threeAct.storyBeats.filter((b) => !isPointBeat(b));
    expect(rangeBeats.length).toBeGreaterThan(0);

    for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) {
      // When several range beats cover one chapter, the export shows the one that started last.
      const covering = rangeBeats
        .filter((b) => {
          const range = getBeatChapterRange(b, CHAPTER_COUNT);
          return chapter >= range.start && chapter <= range.end;
        })
        .sort((a, b) => b.startPercent - a.startPercent);

      const cell = textOf(sheet.getCell(`B${rowOfChapter(chapter)}`));
      if (covering.length > 0) expect(cell).toContain(covering[0].name.toUpperCase());
      else expect(cell).toBe("");
    }
  });

  it("merges a range beat across all the chapters it covers", async () => {
    const { sheet } = await loadSheet(buildProject());
    const rangeBeats = threeAct.storyBeats.filter((b) => !isPointBeat(b));
    const rowsOf = (id: string) => {
      const { firstRow, lastRow } = beatRows(id);
      return Array.from({ length: lastRow - firstRow + 1 }, (_, i) => firstRow + i);
    };
    // Pick a beat that covers 2+ chapters and shares no chapter with another range beat.
    const target = rangeBeats.find((b) => {
      const mine = rowsOf(b.id);
      const others = rangeBeats.filter((o) => o.id !== b.id).flatMap((o) => rowsOf(o.id));
      return mine.length >= 2 && mine.every((r) => !others.includes(r));
    });
    expect(target).toBeDefined();

    const masters = rowsOf(target!.id).map((r) => sheet.getCell(r, 2).master.address);
    expect(new Set(masters).size).toBe(1);
  });

  it("adds beat notes under the beat name and act notes as comments, ignoring blank notes", async () => {
    const project = buildProject({
      storyStructureNotes: {
        "three-act": {
          actNotes: { "ta-act1": "Introduce the world", "ta-act2": "   " },
          beatNotes: { "ta-inciting-incident": "  A letter arrives  ", "ta-exposition": "Quiet village", "ta-midpoint": "" },
        },
      },
    });
    const { sheet } = await loadSheet(project);
    expect(textOf(sheet.getCell("C3"))).toBe("INCITING INCIDENT\nA letter arrives");
    expect(textOf(sheet.getCell("B3"))).toBe("EXPOSITION\nQuiet village");
    // A blank note adds nothing: the beat name is shown without any note text under it.
    const midpoint = beatRows("ta-midpoint");
    expect(textOf(sheet.getCell(`C${midpoint.firstRow}`))).toContain("MIDPOINT");
    expect(JSON.stringify(sheet.getCell("A3").note)).toContain("Introduce the world");
    expect(sheet.getCell("A4").note).toBeUndefined();
  });

  it("uses a custom structure, and falls back to Three-Act if it no longer exists", async () => {
    const custom = await loadSheet(buildProject({ storyStructure: "custom-1" }), [buildCustomStructure()]);
    expect(custom.sheet.getCell("A1").value).toBe("MY TWO PARTS STRUCTURE");
    expect([custom.sheet.getCell("A3").value, custom.sheet.getCell("A6").value]).toEqual(["FIRST HALF", "SECOND HALF"]);
    expect(textOf(custom.sheet.getCell("C3"))).toBe("OPENING");

    const missing = await loadSheet(buildProject({ storyStructure: "deleted-structure" }), []);
    expect(missing.sheet.getCell("A1").value).toBe("THREE-ACT STRUCTURE");
  });

  it("still exports with fewer chapters than acts, or just one chapter", async () => {
    const two = await loadSheet(buildProject({ chapters: buildProject().chapters.slice(0, 2) }));
    expect([two.sheet.getCell("D3").value, two.sheet.getCell("D4").value]).toEqual(["Chapter 1", "Chapter 2"]);

    const one = await loadSheet(buildProject({ chapters: buildProject().chapters.slice(0, 1) }));
    expect([one.sheet.getCell("D3").value, one.sheet.getCell("D4").value]).toEqual(["Chapter 1", null]);
  });
});

describe("structureFileName", () => {
  const day = new Date(2026, 9, 24);

  it("builds '<title> - Story Structure - <date>.xlsx' and cleans the title", () => {
    expect(structureFileName(buildProject(), day)).toBe("Test Novel - Story Structure - 2026-10-24.xlsx");
    expect(structureFileName(buildProject({ title: 'A/B:C*D?"E<F>G|H\\I' }), day)).toBe("A B C D E F G H I - Story Structure - 2026-10-24.xlsx");
    expect(structureFileName(buildProject({ title: "A    B" }), day)).toMatch(/^A B - /);
    expect(structureFileName(buildProject({ title: "Café Noir" }), day)).toMatch(/^Café Noir - /);
    expect(structureFileName(buildProject(), new Date(2026, 0, 5))).toMatch(/2026-01-05\.xlsx$/);
  });

  it("falls back to 'Untitled' for an empty or all-illegal title", () => {
    expect(structureFileName(buildProject({ title: "" }), day)).toMatch(/^Untitled - /);
    expect(structureFileName(buildProject({ title: "???" }), day)).toMatch(/^Untitled - /);
  });
});

describe("exportStructureToExcel (browser download)", () => {
  let createObjectURL: jest.Mock<(blob: Blob) => string>;
  let clickSpy: ReturnType<typeof jest.spyOn>;
  let clicked: { href: string; download: string } | null;

  beforeEach(() => {
    clicked = null;
    createObjectURL = jest.fn(() => "blob:fake-xlsx");
    Object.assign(URL, { createObjectURL, revokeObjectURL: jest.fn() });
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked = { href: this.href, download: this.download };
    });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("downloads an .xlsx blob, returns its file name and removes the temporary link", async () => {
    const timeout = jest.spyOn(globalThis, "setTimeout");
    const fileName = await exportStructureToExcel(buildProject(), []);

    expect(fileName).toMatch(/^Test Novel - Story Structure - \d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(clicked).toEqual({ href: "blob:fake-xlsx", download: fileName });
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const bytes = await readBlobAsBytes(blob);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
    expect(document.querySelector("a[download]")).toBeNull();
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 1000); // frees the blob URL after 1 s
  });

  it("does not start a download when the project has no chapters", async () => {
    await expect(exportStructureToExcel(buildProject({ chapters: [] }), [])).rejects.toBeInstanceOf(ExportError);
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clicked).toBeNull();
  });
});