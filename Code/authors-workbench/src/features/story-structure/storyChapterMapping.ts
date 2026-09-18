import type {
    StoryAct,
    StoryBeat,
} from "./storyStructureTemplate";

export type ChapterRange = {
    start: number;
    end: number;
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


// Calculate a beat's chapters within its own act.
export function getBeatChapterRange(
    beat: StoryBeat,
    actRange: ChapterRange,
    chapterCount: number
) {
    let start = Math.floor(
        chapterCount * beat.startPercent / 100
    ) + 1;

    let end = Math.floor(
        chapterCount * beat.endPercent / 100
    ) + 1;

    // Keep the results inside the act's chapter range.
    start = Math.max(
        actRange.start,
        Math.min(actRange.end, start)
    );

    end = Math.max(
        actRange.start,
        Math.min(actRange.end, end)
    );

    return { start, end };
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