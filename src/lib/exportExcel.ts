import type { Borders, Cell, Worksheet } from "exceljs";
import type { Chapter, WritingProject } from "./domain";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";
import type {
  StoryBeat,
  StoryStructureTemplate,
} from "../features/story-structure/storyStructureTemplate";
import {
  getActChapterRanges,
  getBeatChapterRange,
} from "../features/story-structure/storyChapterMapping";

/* 
 * Export a project's story structure to an Excel (.xlsx) file.

 * The layout follows the structure:
 *   A  Act (merged, rotated)       B  Range beats (merged)     C  Point beats
 *   D  Chapter                     E  POV (left empty to fill in Excel)
 *   F  Chapter Goal                G  Cumulative               H  percentage % of novel
 *   I  Description (chapter notes) J  one TRUE/FALSE column per character
 */

// Set to false to leave the per-character TRUE/FALSE columns out of the sheet.
const INCLUDE_CHARACTER_COLUMNS = true;

// Error type so the UI can show a friendly message.
export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportError";
  }
}

/* ---------------------------- Appearance ---------------- */

const FONT_NAME = "Avenir Book";

const COLORS = {
  title: "1F4E79",
  titleText: "FFD966",
  wordGoal: "C5E0B4",
  numbers: "FFE699",
  pointBeat: "DEEBF7",
  border: "767171",
  text: "333333",
  white: "FFFFFF",
};

// One colour per act (cycled when a structure has more acts).
const ACT_COLORS = ["4377A4", "F4B183", "93C47D", "9468A0", "76A5AF", "DD7E6B"];
// One colour per range beat (cycled).
const BEAT_COLORS = ["6FA8DC", "76A5AF", "CC0000", "BF9000", "7030A0", "9468A0", "DD7E6B"];
// One colour per character column (cycled).
const CHARACTER_COLORS = ["FF8AD8", "F4B183", "82CBF4", "B6D7A8", "FFE599", "B4A7D6", "EA9999"];

const thin = { style: "thin" as const, color: { argb: `FF${COLORS.border}` } };
const BORDER: Partial<Borders> = { top: thin, left: thin, bottom: thin, right: thin };

// Column numbers, so nothing below depends on "magic" numbers.
const COL = {
  act: 1,
  rangeBeat: 2,
  pointBeat: 3,
  chapter: 4,
  pov: 5,
  goal: 6,
  cumulative: 7,
  percent: 8,
  description: 9,
  firstCharacter: 10,
};
const WIDTH = {
  act: 6.5,
  rangeBeat: 23.5,
  pointBeat: 30.5,
  chapter: 16,
  pov: 11,
  goal: 9,
  cumulative: 11.5,
  percent: 8,
  description: 45,
  character: 12,
};

const argb = (hex: string) => `FF${hex}`;
const solid = (hex: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: argb(hex) } });

/* ---------------------------- Small helpers --------------------------------- */

// Visual length of a string: CJK characters are about twice as wide as Latin ones.
const visualLength = (text: string) =>
  [...text].reduce((sum, ch) => sum + ((ch.codePointAt(0) ?? 0) > 255 ? 2 : 1), 0);

// Estimates how many wrapped lines the text needs in a column.
function estimateLines(text: string, columnWidth: number, fontSize: number): number {
  if (!text) return 1;
  const charsPerLine = Math.max(4, Math.floor((columnWidth * 5.25) / (fontSize * 0.52)));
  return text
    .split("\n")
    .reduce((lines, paragraph) => lines + Math.max(1, Math.ceil(visualLength(paragraph) / charsPerLine)), 0);
}

const lineHeight = (fontSize: number) => fontSize * 1.3;

// Removes characters that are not allowed in file names.
const safeFileName = (name: string) =>
  name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled";

// Title shown in the top-left cell, e.g. "SAVE THE CAT STRUCTURE".
function sheetTitle(template: StoryStructureTemplate): string {
  const name = template.name.trim().toUpperCase();
  return name.endsWith("STRUCTURE") ? name : `${name} STRUCTURE`;
}

/* ---------------------------- collect the data ---------------------- */

interface BeatCell {
  id: string;
  text: string; 
  note: string; 
}

interface ChapterRow {
  chapter: Chapter;
  actIndex: number; 
  rangeBeat: BeatCell | null;
  pointBeats: BeatCell[];
  characterIds: Set<string>;
}

// Gathers everything one chapter row needs, using the same rules as the app.
function buildRows(
  project: WritingProject,
  template: StoryStructureTemplate
): ChapterRow[] {
  const chapters = [...project.chapters].sort((a, b) => a.order - b.order);
  const count = chapters.length;

  const notes = project.storyStructureNotes?.[template.id];
  const toCell = (beat: StoryBeat): BeatCell => ({
    id: beat.id,
    text: beat.name.toUpperCase(),
    note: notes?.beatNotes?.[beat.id]?.trim() ?? "",
  });

  const actRanges = getActChapterRanges(template.acts, count);

  // A beat that covers several chapters is a "range" beat, otherwise a "point" beat.
  const rangeBeats = template.storyBeats.filter((b) => b.startPercent !== b.endPercent);
  const pointBeats = template.storyBeats.filter((b) => b.startPercent === b.endPercent);

  return chapters.map((chapter, index) => {
    const num = index + 1;

    const actIndex = actRanges.findIndex((r) => num >= r.start && num <= r.end);

    // If several range beats cover this chapter, take the one that started last.
    const covering = rangeBeats
      .filter((b) => {
        const r = getBeatChapterRange(b, count);
        return num >= r.start && num <= r.end;
      })
      .sort((a, b) => b.startPercent - a.startPercent);

    const points = pointBeats.filter((b) => getBeatChapterRange(b, count).start === num);

    // Characters: the chapter's own + those of its linked events and scenes.
    const characterIds = new Set<string>(chapter.characterIds ?? []);
    (project.events ?? [])
      .filter((e) => e.chapterIds.includes(chapter.id))
      .forEach((e) => (e.characterIds ?? []).forEach((id) => characterIds.add(id)));
    (project.scenes ?? [])
      .filter((s) => s.chapterIds.includes(chapter.id))
      .forEach((s) => (s.characterIds ?? []).forEach((id) => characterIds.add(id)));

    return {
      chapter,
      actIndex,
      rangeBeat: covering[0] ? toCell(covering[0]) : null,
      pointBeats: points.map(toCell),
      characterIds,
    };
  });
}

/* ---------------------------- write the sheet ----------------------- */

// Writes "NAME" in bold followed by the note in regular type, in one cell.
function setBeatText(cell: Cell, name: string, note: string, size: number, color: string) {
  const base = { name: FONT_NAME, size, color: { argb: argb(color) } };
  cell.value = {
    richText: [
      { text: name, font: { ...base, bold: true } },
      ...(note ? [{ text: `\n${note}`, font: { ...base, bold: false } }] : []),
    ],
  };
}

// Builds the workbook in memory and returns it as file bytes.
export async function buildStructureWorkbook(
  project: WritingProject,
  customStructures: StoryStructureTemplate[]
): Promise<ArrayBuffer> {
  if (project.chapters.length === 0) {
    throw new ExportError("This project has no chapters yet. Add chapters in Chapter Plan first.");
  }

  const template = getStoryStructureOption(project.storyStructure, customStructures);
  const rows = buildRows(project, template);
  const actNotes = project.storyStructureNotes?.[template.id]?.actNotes ?? {};

  // Characters that appear in at least one chapter become columns.
  const usedCharacterIds = new Set(rows.flatMap((r) => [...r.characterIds]));
  const characters = INCLUDE_CHARACTER_COLUMNS
    ? (project.characters ?? []).filter((c) => usedCharacterIds.has(c.id))
    : [];

  // exceljs is large, so it is only loaded when the user actually exports.
  const mod = await import("exceljs");
  const ExcelJS = ("default" in mod ? mod.default : mod) as typeof import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Author's Workbench";
  workbook.created = new Date();
  const sheet: Worksheet = workbook.addWorksheet("STRUCTURE", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 2, zoomScale: 100 }],
  });

  // Column widths
  const widths = [
    WIDTH.act, WIDTH.rangeBeat, WIDTH.pointBeat, WIDTH.chapter, WIDTH.pov,
    WIDTH.goal, WIDTH.cumulative, WIDTH.percent, WIDTH.description,
    ...characters.map(() => WIDTH.character),
  ];
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

  /* Row 1: title */
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = sheetTitle(template);
  titleCell.font = { name: FONT_NAME, size: 12, bold: true, color: { argb: argb(COLORS.titleText) } };
  titleCell.fill = solid(COLORS.title);
  titleCell.alignment = { horizontal: "center", vertical: "top" };
  sheet.mergeCells(1, 1, 1, 3);

  /* Row 2: word goal + column headers */
  sheet.getRow(2).height = 40;
  for (let c = 1; c <= 3; c++) sheet.getCell(2, c).fill = solid(COLORS.wordGoal);
  const goalLabel = sheet.getCell(2, COL.rangeBeat);
  goalLabel.value = "WORD GOAL";
  const goalValue = sheet.getCell(2, COL.pointBeat);
  goalValue.value = project.targetWordCount;
  goalValue.numFmt = "#,##0";
  [goalLabel, goalValue].forEach((cell) => {
    cell.font = { name: FONT_NAME, size: 12, bold: true };
    cell.alignment = { horizontal: "center", vertical: "top", wrapText: true };
  });

  const headers: { col: number; text: string; fill?: string; size: number; center?: boolean }[] = [
    { col: COL.chapter, text: "Chapter", size: 11 },
    { col: COL.pov, text: "POV", size: 11 },
    { col: COL.goal, text: "Chapter Goal", fill: COLORS.numbers, size: 9 },
    { col: COL.cumulative, text: "Cumulative", fill: COLORS.numbers, size: 9 },
    { col: COL.percent, text: "% novel", fill: COLORS.numbers, size: 9, center: true },
    { col: COL.description, text: "DESCRIPTION", fill: COLORS.numbers, size: 9, center: true },
    ...characters.map((c, i) => ({
      col: COL.firstCharacter + i,
      text: c.name.toUpperCase(),
      fill: CHARACTER_COLORS[i % CHARACTER_COLORS.length],
      size: 9,
      center: true,
    })),
  ];
  headers.forEach((h) => {
    const cell = sheet.getCell(2, h.col);
    cell.value = h.text;
    cell.font = { name: FONT_NAME, size: h.size, bold: true };
    if (h.fill) cell.fill = solid(h.fill);
    cell.border = BORDER;
    cell.alignment = { horizontal: h.center ? "center" : "left", vertical: "top", wrapText: true };
  });

  /* Chapter rows */
  const FIRST_ROW = 3;
  const rowHeights: number[] = [];
  let cumulative = 0;

  rows.forEach((row, i) => {
    const r = FIRST_ROW + i;
    const goal = row.chapter.targetWordCount || 0;
    cumulative += goal;

    // Column C: point beats (name in bold + the author's note)
    const pointCell = sheet.getCell(r, COL.pointBeat);
    pointCell.fill = solid(COLORS.pointBeat);
    pointCell.border = BORDER;
    pointCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    const pointText: string[] = [];
    if (row.pointBeats.length > 0) {
      const runs = row.pointBeats.flatMap((b, bi) => [
        ...(bi > 0 ? [{ text: "\n\n", font: { name: FONT_NAME, size: 11, bold: false } }] : []),
        { text: b.text, font: { name: FONT_NAME, size: 11, bold: true, color: { argb: argb(COLORS.text) } } },
        ...(b.note
          ? [{ text: `\n${b.note}`, font: { name: FONT_NAME, size: 11, bold: false, color: { argb: argb(COLORS.text) } } }]
          : []),
      ]);
      pointCell.value = { richText: runs };
      row.pointBeats.forEach((b) => pointText.push(b.note ? `${b.text}\n${b.note}` : b.text));
    }

    // Column D: chapter title
    const chapterCell = sheet.getCell(r, COL.chapter);
    chapterCell.value = row.chapter.title;
    chapterCell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: argb(COLORS.text) } };
    chapterCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    chapterCell.border = BORDER;

    // Column E: POV (empty, the author can type it in Excel)
    const povCell = sheet.getCell(r, COL.pov);
    povCell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: argb(COLORS.text) } };
    povCell.alignment = { horizontal: "left", vertical: "top" };
    povCell.border = BORDER;

    // Columns F-H: goal, cumulative (formula), % of the novel (formula)
    const small = { name: FONT_NAME, size: 9, color: { argb: argb(COLORS.text) } };
    const goalCell = sheet.getCell(r, COL.goal);
    goalCell.value = goal;
    const cumCell = sheet.getCell(r, COL.cumulative);
    cumCell.value =
      i === 0
        ? { formula: `F${r}`, result: cumulative }
        : { formula: `F${r}+G${r - 1}`, result: cumulative };
    const pctCell = sheet.getCell(r, COL.percent);
    pctCell.value = {
      formula: `IF($C$2>0,G${r}/$C$2,"")`,
      result: project.targetWordCount > 0 ? cumulative / project.targetWordCount : "",
    };
    [goalCell, cumCell, pctCell].forEach((cell) => {
      cell.font = small;
      cell.fill = solid(COLORS.numbers);
      cell.border = BORDER;
      cell.alignment = { horizontal: cell === pctCell ? "center" : "left", vertical: "top" };
    });
    goalCell.numFmt = "#,##0";
    cumCell.numFmt = "#,##0";
    pctCell.numFmt = "0.0%";

    // Column I: description = chapter notes
    const descCell = sheet.getCell(r, COL.description);
    descCell.value = row.chapter.notes ?? "";
    descCell.font = small;
    descCell.fill = solid(COLORS.numbers);
    descCell.border = BORDER;
    descCell.alignment = { horizontal: "center", vertical: "top", wrapText: true };

    // Character columns: TRUE / FALSE
    characters.forEach((character, ci) => {
      const cell = sheet.getCell(r, COL.firstCharacter + ci);
      cell.value = row.characterIds.has(character.id);
      cell.font = small;
      cell.fill = solid(CHARACTER_COLORS[ci % CHARACTER_COLORS.length]);
      cell.border = BORDER;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });

    // Row height from the tallest non-merged cell.
    const needed = Math.max(
      estimateLines(row.chapter.title, WIDTH.chapter, 11) * lineHeight(11),
      estimateLines(row.chapter.notes ?? "", WIDTH.description, 9) * lineHeight(9),
      estimateLines(pointText.join("\n\n"), WIDTH.pointBeat, 11) * lineHeight(11)
    );
    rowHeights.push(Math.min(409, Math.max(30, needed + 6)));
  });

  // Column A: acts (merged, rotated)
  const groupBy = <T,>(keyOf: (row: ChapterRow) => T | null) => {
    const groups: { key: T; from: number; to: number }[] = [];
    rows.forEach((row, i) => {
      const key = keyOf(row);
      if (key === null) return;
      const last = groups[groups.length - 1];
      if (last && last.key === key && last.to === i - 1) last.to = i;
      else groups.push({ key, from: i, to: i });
    });
    return groups;
  };

  // If a merged cell needs more height than its rows have, make the rows taller.
  const ensureHeight = (from: number, to: number, needed: number) => {
    const have = rowHeights.slice(from, to + 1).reduce((s, h) => s + h, 0);
    if (have >= needed) return;
    const extra = (needed - have) / (to - from + 1);
    for (let k = from; k <= to; k++) rowHeights[k] = Math.min(409, rowHeights[k] + extra);
  };

  groupBy((row) => (row.actIndex >= 0 ? row.actIndex : null)).forEach((g) => {
    const act = template.acts[g.key];
    const cell = sheet.getCell(FIRST_ROW + g.from, COL.act);
    cell.value = act.name.toUpperCase();
    cell.font = { name: FONT_NAME, size: 22, bold: true, color: { argb: argb(COLORS.white) } };
    cell.fill = solid(ACT_COLORS[g.key % ACT_COLORS.length]);
    cell.alignment = { textRotation: 90, horizontal: "left", vertical: "middle" };
    if (actNotes[act.id]?.trim()) cell.note = actNotes[act.id].trim(); // note shows as an Excel comment
    ensureHeight(g.from, g.to, visualLength(act.name) * 22 * 0.75 + 20);
    if (g.to > g.from) sheet.mergeCells(FIRST_ROW + g.from, COL.act, FIRST_ROW + g.to, COL.act);
  });

  // Column B: range beats
  const beatColors = new Map<string, string>();
  groupBy((row) => row.rangeBeat?.id ?? null).forEach((g) => {
    const beat = rows[g.from].rangeBeat!;
    if (!beatColors.has(beat.id)) beatColors.set(beat.id, BEAT_COLORS[beatColors.size % BEAT_COLORS.length]);
    const cell = sheet.getCell(FIRST_ROW + g.from, COL.rangeBeat);
    setBeatText(cell, beat.text, beat.note, 12, COLORS.white);
    cell.fill = solid(beatColors.get(beat.id)!);
    cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    const lines = estimateLines(beat.note ? `${beat.text}\n${beat.note}` : beat.text, WIDTH.rangeBeat, 12);
    ensureHeight(g.from, g.to, lines * lineHeight(12) + 6);
    if (g.to > g.from) sheet.mergeCells(FIRST_ROW + g.from, COL.rangeBeat, FIRST_ROW + g.to, COL.rangeBeat);
  });

  rowHeights.forEach((h, i) => (sheet.getRow(FIRST_ROW + i).height = Math.round(h)));

  // Print setup: landscape, fit to one page wide.
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  return workbook.xlsx.writeBuffer();
}

/* ---------------------------- download ------------------------------ */

export function structureFileName(project: WritingProject, date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${safeFileName(project.title)} - Story Structure - ${stamp}.xlsx`;
}

// Builds the workbook and makes the browser download it.
export async function exportStructureToExcel(
  project: WritingProject,
  customStructures: StoryStructureTemplate[]
): Promise<string> {
  const buffer = await buildStructureWorkbook(project, customStructures);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const fileName = structureFileName(project);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
