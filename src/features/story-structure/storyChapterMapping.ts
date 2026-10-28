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

function getChapterPosition(
    chapterCount: number,
    percent: number
) {
    const position = chapterCount * percent / 100;
    const nearestInteger = Math.round(position);
    const tolerance = Number.EPSILON * chapterCount;

    // Correct floating-point drift before the caller chooses floor or ceil.
    return Math.abs(position - nearestInteger) <= tolerance
        ? nearestInteger
        : position;
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
        const remainingActs = acts.length - index - 1;
        const maximumEnd = chapterCount - remainingActs;

        // Give this act at least one chapter and reserve one for each remaining act.
        const end = Math.min(
            maximumEnd,
            Math.max(
                start,
                Math.floor(getChapterPosition(chapterCount, act.endPercent))
            )
        );

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
    const clampToChapter = (chapter: number) =>
        Math.max(1, Math.min(chapterCount, chapter));

    const end = clampToChapter(
        Math.ceil(
            getChapterPosition(chapterCount, beat.endPercent)
        )
    );

    // A point belongs to the chapter ending there.
    // A range starts after its lower boundary.
    const start = beat.startPercent === beat.endPercent
        ? end
        : clampToChapter(
            Math.floor(
                getChapterPosition(chapterCount, beat.startPercent)
            ) + 1
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