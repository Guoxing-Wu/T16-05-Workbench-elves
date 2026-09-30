import type { StoryStructureId } from "../features/story-structure/storyStructureTemplate";

// A single chapter within a project.
export interface Chapter {
  id: string;
  order: number;
  title: string;
  targetWordCount: number;
  actualWordCount: number;
  notes: string;
  characterIds?: string[];
  locationIds?: string[];
}

// Author can write notes for the template
export interface StoryTemplateNotes {
  actNotes: Record<string, string>;
  beatNotes: Record<string, string>;
}

// A writing project shows up as a card in the overview and as the detail page once opened.
export interface WritingProject {
  id: string;
  title: string;
  targetWordCount: number;
  averageChapterLength: number;
  storyStructure: StoryStructureId;
  storyStructureNotes?: Record<string, StoryTemplateNotes>;
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  events: StoryEvent[];
  scenes: StoryScene[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

// Local-only id generator.
export const makeId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;


// Builds a new empty chapter with an order.
export function makeChapter(order: number, n: number): Chapter {
  return {
    id: makeId(),
    order,
    title: `Chapter ${n}`,
    targetWordCount: 0,
    actualWordCount: 0,
    notes: "",
  };
}

// Builds a new project with no chapters yet. 
export function createProject(input: {
  title: string;
  targetWordCount: number;
  averageChapterLength: number;
  storyStructure: StoryStructureId;
}): WritingProject {
  const stamp = Date.now();
  const estimate =
    input.averageChapterLength > 0
      ? Math.max(1, Math.round(input.targetWordCount / input.averageChapterLength))
      : 0;
  const chapters: Chapter[] =
    estimate > 0
      ? Array.from({ length: estimate }, (_, i) => makeChapter(i, i + 1)).map((c) => ({
        ...c,
        targetWordCount: input.averageChapterLength,
      }))
      : [];
  return {
    id: makeId(),
    title: input.title,
    targetWordCount: input.targetWordCount,
    averageChapterLength: input.averageChapterLength,
    storyStructure: input.storyStructure,
    // New projects start without story structure notes
    storyStructureNotes: {},
    chapters,
    characters: [],
    locations: [],
    events: [],
    scenes: [],
    createdAt: stamp,
    updatedAt: stamp,
    lastOpenedAt: stamp
  };
}

// Calculates total words written so far which is the sum of every chapter's actual word count.
export function wordsWritten(project: WritingProject): number {
  return project.chapters.reduce((sum, c) => sum + (c.actualWordCount || 0), 0);
}

// A named place in the story world. Events link to it by id.
export interface Location {
  id: string;
  name: string;
  description?: string;
}

// Build a new location.
export function makeLocation(input: { name: string; description?: string }): Location {
  return {
    id: makeId(),
    name: input.name.trim(),
    description: input.description?.trim() || "",
  };
}

//internal date with flexible precision
//year is required; month and date are optional - more flexibility
export interface StoryDate {
  year: number;
  month?: number; // 1–12, optional
  day?: number;   // 1–31, optional
}
//a story event or milestone tied to a specific chapter
export interface StoryEvent {
  id: string;
  chapterIds: string[];
  title: string;
  description: string;

  startDate: StoryDate;
  endDate: StoryDate;

  characterIds?: string[];
  locationId?: string;

  isStoryBeat: boolean;
  storyBeatId?: string;
  storyBeatName?: string;
}

export interface StoryScene {
  id: string;
  title: string;
  description: string;

  date: StoryDate;

  eventId?: string;
  chapterIds: string[];

  characterIds?: string[];
  locationId?: string;
}

//A character in the story
export interface Character {
  id: string;
  name: string;
  birthday: StoryDate;
  description?: string;
  location?: string;
  role?: string;
  gender?: string;
}

// Build a new character with the provided info
export function makeCharacter(input: {
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthday: StoryDate;
  description?: string;
  location?: string;
  role?: string;
  gender?: string;
}): Character {
  return {
    id: makeId(),
    name: [input.firstName, input.middleName, input.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" "),
    birthday: input.birthday,
    description: input.description ?? "",
    location: input.location ?? "",
    role: input.role ?? "",
    gender: input.gender ?? ""
  };
}

// Build a new story event tied to chapters
export function makeStoryEvent(input: {
  chapterIds: string[];
  title: string;
  description?: string;
  characterIds?: string[];
  startDate: StoryDate;
  endDate: StoryDate;
  locationId?: string;
  isStoryBeat: boolean;
  storyBeatId?: string;
  storyBeatName?: string;
}): StoryEvent {
  return {
    id: makeId(),
    chapterIds: input.chapterIds,
    title: input.title,
    description: input.description ?? "",
    characterIds: input.characterIds,
    startDate: input.startDate,
    endDate: input.endDate,
    locationId: input.locationId,
    isStoryBeat: input.isStoryBeat,
    storyBeatId: input.storyBeatId,
    storyBeatName: input.storyBeatName,
  };
}
  // Build a new scene
  export function makeStoryScene(input: {
    title: string;
    description?: string;
    date: StoryDate;
    eventId?: string;
    chapterIds: string[];
    characterIds?: string[];
    locationId?: string;
  }): StoryScene {
    return {
      id: makeId(),
      title: input.title.trim(),
      description: input.description ?? "",
      date: input.date,
      eventId: input.eventId,
      chapterIds: input.chapterIds,
      characterIds: input.characterIds,
      locationId: input.locationId,
    };
  }

// Computes a character's age at a given point in the story timeline.
export function characterAgeAtYear(birth: StoryDate, reference: StoryDate): number {
  let age = reference.year - birth.year;

  const bothHaveMonth = birth.month !== undefined && reference.month !== undefined;
  if (bothHaveMonth) {
    if (reference.month! < birth.month!) {
      age--;
    } else if (reference.month === birth.month) {
      const bothHaveDay = birth.day !== undefined && reference.day !== undefined;
      if (bothHaveDay && reference.day! < birth.day!) {
        age--;
      }
    }
  }
  return age;
}

// Formats a StoryDate for display, matching whaterver precision was recorded
export function formatStoryDate(date: StoryDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (date.month !== undefined && date.day !== undefined) {
    return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
  }
  if (date.month !== undefined) {
    return `${date.year}-${pad(date.month)}`;
  }
  return `${date.year}`;
}