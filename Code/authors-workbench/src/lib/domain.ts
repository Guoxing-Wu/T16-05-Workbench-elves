import type { StoryStructureId } from "../features/story-structure/storyStructureTemplate";

// A single chapter within a project.
export interface Chapter {
  id: string;
  order: number;
  title: string;
  targetWordCount: number;
  actualWordCount: number;
}

// A writing project shows up as a card in the overview and as the detail page once opened.
export interface WritingProject {
  id: string;
  title: string;
  targetWordCount: number;
  averageChapterLength: number;
  storyStructure: StoryStructureId;
  chapters: Chapter[];
  characters: Character[];
  events: StoryEvent[];
  createdAt: number;
  updatedAt: number;
}

// Local-only id generator.
//export const makeId = () => `local-${crypto.randomUUID()}`;
export const makeId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;


// Builds a new empty chapter with an order.
export function makeChapter(order: number, n: number): Chapter {
  return {
    id: makeId(),
    order,
    title: `Chapter ${n}`,
    targetWordCount: 0,
    actualWordCount: 0,
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
  return {
    id: makeId(),
    title: input.title,
    targetWordCount: input.targetWordCount,
    averageChapterLength: input.averageChapterLength,
    storyStructure: input.storyStructure,
    chapters: [],
    characters: [],
    events: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

// Calculates total words written so far which is the sum of every chapter's actual word count.
export function wordsWritten(project: WritingProject): number {
  return project.chapters.reduce((sum, c) => sum + (c.actualWordCount || 0), 0);
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
  chapterIds: string[]; // Allow multiple chapter linkage
  title: string;
  description: string;
  eventDate: StoryDate; // The in-story year this event takes place
  characterIds?: string[]
  location: string
}

//A character in the story
export interface Character{
  id: string;
  name: string;
  birthday: StoryDate;
  description?: string;
  location?: string;
}

// Build a new character with the provided info
export function makeCharacter(input:{
    name: string;
    birthday: StoryDate;
    description?: string;
    location?: string;
}): Character{
  return{
    id: makeId(),
    name: input.name,
    birthday: input.birthday,
    description: input.description ?? "",
    location: input.location ?? "",
  };
}

// Build a new story event tied to chapters
export function makeStoryEvent(input: {
  chapterIds: string[];
  title: string;
  description?: string;
  characterIds?: string[];
  eventDate: StoryDate;
  location: string;
}): StoryEvent {
  return {
    id: makeId(),
    chapterIds: input.chapterIds,
    title: input.title,
    description: input.description ?? "",
    characterIds: input.characterIds,
    eventDate: input.eventDate,
    location: input.location,
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