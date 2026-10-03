import type {
    StoryAct,
    StoryBeat,
    StoryStructureTemplate,
} from "./storyStructureTemplate";

export type ChapterRange = {
    start: number;
    end: number;
};

export type StoryBeatChapterMapping = {
    storyBeatId: string;
    storyBeatName: string;
    chapterRange: ChapterRange;
};

export function getProjectedChapterCount(
    targetWordCount: number,
    averageChapterLength: number
) {
    if (targetWordCount <= 0 || averageChapterLength <= 0) {
        return 0;
    }

    return Math.max(
        1, Math.round(targetWordCount / averageChapterLength)
    );
}


// Allocate consecutive chapters to the acts
export function getActChapterRanges(
    acts: StoryAct[],
    chapterCount: number
) {
    const ranges: ChapterRange[] = [];

    // Every act needs at least one chapter
    if (chapterCount < acts.length) {
        return ranges;
    }

    let start = 1;
    for (let index = 0; index < acts.length; index++) {
        const act = acts[index];
        let end = Math.floor(
            chapterCount * act.endPercent / 100
        );

        // Remain at least one chapter for every remaining act
        const remainingActs = acts.length - index - 1;
        const maximumEnd = chapterCount - remainingActs;

        if (end < start) {
            end = start;
        }

        if (end > maximumEnd) {
            end = maximumEnd;
        }

        ranges.push({ start, end });

        // Start the next act after this act ends
        start = end + 1;
    }

    return ranges;
}


// Calculate a beat's chapters within its percentages.

export function getBeatChapterRange(
    beat: StoryBeat,
    chapterCount: number
): ChapterRange {
    const getChapterAtPercent = (percent: number) =>
        Math.max(
            1,
            Math.min(
                chapterCount,
                Math.floor(
                    chapterCount * percent / 100
                ) + 1
            )
        );

    return {
        start: getChapterAtPercent(beat.startPercent),
        end: getChapterAtPercent(beat.endPercent),
    };
}

// Display one chapter or a chapter range.
export function getChapterRangeLabel(
    range: ChapterRange | undefined
) {
    if (!range) {
        return "Not mapped";
    }

    if (range.start === range.end) {
        return "Chapter " + range.start;
    }

    return "Chapters " + range.start + "–" + range.end;
}

export function getPercentRangeLabel(
    startPercent: number,
    endPercent: number
) {
    const start = Number(startPercent.toFixed(1));
    const end = Number(endPercent.toFixed(1));

    if (start === end) {
        return start + "%";
    }

    return start + "%–" + end + "%";
}

// Map every Story Beat to chapters.
export function getStoryBeatChapterMappings(
    template: StoryStructureTemplate,
    chapterCount: number
): StoryBeatChapterMapping[] {
    if (chapterCount <= 0) {
        return [];
    }

    return template.storyBeats.map((beat) => ({
        storyBeatId: beat.id,
        storyBeatName: beat.name,
        chapterRange: getBeatChapterRange(
            beat,
            chapterCount
        ),
    }));
}