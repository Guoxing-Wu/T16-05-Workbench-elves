// Shared test data + small helpers for the backup / database / Excel-export tests.
import type { WritingProject } from "../lib/domain";
import type { StoryStructureTemplate } from "../features/story-structure/storyStructureTemplate";

// A fully populated, 6-chapter "three-act" project.
//   - Alice appears in chapter 1 (her own list) and chapter 3 (through a scene)
//   - Bob appears in chapter 2 (through an event)
//   - Nobody appears in no chapter, so she must NOT get an Excel column
export function buildProject(overrides: Partial<WritingProject> = {}): WritingProject {
  const chapters = Array.from({ length: 6 }, (_, i) => ({
    id: `ch${i + 1}`,
    order: i,
    title: `Chapter ${i + 1}`,
    targetWordCount: 2000,
    actualWordCount: 500 * (i + 1),
    notes: `Notes for chapter ${i + 1}`,
    ...(i === 0 ? { characterIds: ["c1"] } : {}),
  }));

  return {
    id: "p1",
    title: "Test Novel",
    targetWordCount: 12000,
    averageChapterLength: 2000,
    storyStructure: "three-act",
    storyStructureNotes: {},
    chapters,
    characters: [
      { id: "c1", name: "Alice", birthday: { year: 1990 } },
      { id: "c2", name: "Bob", birthday: { year: 1985, month: 3, day: 2 } },
      { id: "c3", name: "Nobody", birthday: { year: 2000 } },
    ],
    locations: [{ id: "l1", name: "Harbour" }],
    events: [
      {
        id: "e1",
        title: "The storm",
        description: "A storm hits.",
        chapterIds: ["ch2"],
        startDate: { year: 2020, month: 1, day: 1 },
        endDate: { year: 2020, month: 1, day: 2 },
        characterIds: ["c2"],
        isStoryBeat: false,
      },
    ],
    scenes: [
      {
        id: "s1",
        title: "Dock fight",
        description: "",
        chapterIds: ["ch3"],
        date: { year: 2020 },
        characterIds: ["c1"],
      },
    ],
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_100_000,
    lastOpenedAt: 1_700_000_200_000,
    ...overrides,
  };
}

export function buildCustomStructure(
  overrides: Partial<StoryStructureTemplate> = {}
): StoryStructureTemplate {
  return {
    id: "custom-1",
    name: "My Two Parts",
    description: "Two acts",
    isCustom: true,
    acts: [
      { id: "ca1", name: "First half", startPercent: 0, endPercent: 50 },
      { id: "ca2", name: "Second half", startPercent: 50, endPercent: 100 },
    ],
    storyBeats: [
      { id: "cb1", name: "Opening", startPercent: 0, endPercent: 0 },
      { id: "cb2", name: "Turn", startPercent: 50, endPercent: 50 },
    ],
    ...overrides,
  };
}

// jsdom's Blob has no .text() in every version, so read it through FileReader.
export function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export function readBlobAsBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
