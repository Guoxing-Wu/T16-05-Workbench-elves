import { describe, expect, it } from "@jest/globals";

import {
    getActChapterRanges,
    getBeatChapterRange,
    getProjectedChapterCount,
} from "./storyChapterMapping";
import { STORY_STRUCTURE_OPTIONS } from "./storyStructureTemplate";

describe("getProjectedChapterCount", () => {
    it("calculates projected chapters from the planning settings", () => {
        expect(
            getProjectedChapterCount(60000, 3000)
        ).toBe(20);
    });
});

describe("getActChapterRanges", () => {
    it.each([
        {
            templateId: "three-act",
            chapterCount: 20,
            expected: [
                { start: 1, end: 5 },
                { start: 6, end: 15 },
                { start: 16, end: 20 },
            ],
        },
        {
            templateId: "save-the-cat",
            chapterCount: 44,
            expected: [
                { start: 1, end: 10 },
                { start: 11, end: 34 },
                { start: 35, end: 44 },
            ],
        },
    ])(
        "maps $templateId across $chapterCount chapters in act order",
        ({ templateId, chapterCount, expected }) => {
            const template = STORY_STRUCTURE_OPTIONS.find(
                (option) => option.id === templateId
            );

            if (!template) {
                throw new Error(
                    `Missing built-in template: ${templateId}`
                );
            }

            expect(
                getActChapterRanges(template.acts, chapterCount)
            ).toEqual(expected);
        }
    );
});

describe("getBeatChapterRange", () => {
    it.each([
        {
            templateId: "three-act",
            beatId: "ta-exposition",
            chapterCount: 24,
            expected: { start: 1, end: 3 },
        },
        {
            templateId: "three-act",
            beatId: "ta-plot-point1",
            chapterCount: 20,
            expected: { start: 5, end: 5 },
        },
        {
            templateId: "three-act",
            beatId: "ta-rising-action",
            chapterCount: 20,
            expected: { start: 6, end: 10 },
        },

        {
            templateId: "heros-journey",
            beatId: "hj-refusal",
            chapterCount: 30,
            expected: { start: 4, end: 5 },
        },
        {
            templateId: "heros-journey",
            beatId: "hj-return-elixir",
            chapterCount: 20,
            expected: { start: 20, end: 20 },
        },

        {
            templateId: "save-the-cat",
            beatId: "sat-catalyst",
            chapterCount: 20,
            expected: { start: 3, end: 3 },
        },
        {
            templateId: "save-the-cat",
            beatId: "sat-dark-night",
            chapterCount: 44,
            expected: { start: 31, end: 34 },
        },
    ])(
        "maps $beatId within a $chapterCount-chapter plan",
        ({ templateId, beatId, chapterCount, expected }) => {
            const template = STORY_STRUCTURE_OPTIONS.find(
                (option) => option.id === templateId
            );

            const beat = template?.storyBeats.find(
                (item) => item.id === beatId
            );

            if (!beat) {
                throw new Error(
                    `Missing beat ${beatId} in ${templateId}`
                );
            }

            expect(
                getBeatChapterRange(beat, chapterCount)
            ).toEqual(expected);
        }
    );
});