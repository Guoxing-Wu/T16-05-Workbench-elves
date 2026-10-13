import { makeChapter, wordsWritten, createProject } from "./domain";
import type { WritingProject } from "./domain";
describe("makeChapter", () => {
  test("creates a chapter with the correct values", () => {
    const chapter = makeChapter(0, 1);

    expect(chapter.order).toBe(0);
    expect(chapter.title).toBe("Chapter 1");
    expect(chapter.targetWordCount).toBe(0);
    expect(chapter.actualWordCount).toBe(0);
    expect(chapter.notes).toBe("");
    expect(chapter.id).toBeDefined();
  });
});

describe("wordsWritten", () => {
    test("returns the total actual word count", () => {
        const project = {
            chapters: [
                {
                    id:"1",
                    order: 0,
                    title: "Chapter 1",
                    targetWordCount: 2000,
                    actualWordCount: 1000,
                    notes: "",
                },
                {
                    id: "2",
                    order: 1,
                    title: "Chapter 2",
                    targetWordCount: 2000,
                    actualWordCount: 1500,
                    notes: "",
                    },
            ],
        } as WritingProject;

        expect(wordsWritten(project)).toBe(2500);
    });
});

describe("createProject", () => {
  test("creates a project with the correct information", () => {
    const project = createProject({
      title: "My Story",
      targetWordCount: 60000,
      averageChapterLength: 3000,
      storyStructure: "three-act",
    });

    expect(project.title).toBe("My Story");
    expect(project.targetWordCount).toBe(60000);
    expect(project.averageChapterLength).toBe(3000);
    expect(project.storyStructure).toBe("three-act");
  });
});