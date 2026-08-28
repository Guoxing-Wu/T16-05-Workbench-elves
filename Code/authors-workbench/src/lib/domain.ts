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
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

// Local-only id generator.
export const makeId = () => `local-${crypto.randomUUID()}`;

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
export function createProject(input: { title: string; targetWordCount: number }): WritingProject {
  const stamp = Date.now();
  return {
    id: makeId(),
    title: input.title,
    targetWordCount: input.targetWordCount,
    chapters: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

// Calculates total words written so far which is the sum of every chapter's actual word count.
export function wordsWritten(project: WritingProject): number {
  return project.chapters.reduce((sum, c) => sum + (c.actualWordCount || 0), 0);
}
