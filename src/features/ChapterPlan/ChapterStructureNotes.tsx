import type { Chapter, WritingProject } from "../../lib/domain";
import { useWorkbench } from "../../lib/store";
import { getStoryStructureOption } from "../story-structure/storyStructureTemplate";
import {
    getActChapterRanges,
    getChapterRangeLabel,
    getProjectedChapterCount,
    getStoryBeatChapterMappings,
} from "../story-structure/storyChapterMapping";

type Props = {
    project: WritingProject;
    chapter: Chapter;
};

export function ChapterStructureNotes({ project, chapter }: Props) {
    const { customStoryStructures } = useWorkbench();

    const template = getStoryStructureOption(
        project.storyStructure,
        customStoryStructures
    );
    const templateNotes = project.storyStructureNotes?.[template.id];

    // Match the chapter ranges displayed on Story Structure.
    const hasValidSettings =
        Number.isInteger(project.targetWordCount) &&
        project.targetWordCount > 0 &&
        Number.isInteger(project.averageChapterLength) &&
        project.averageChapterLength > 0;

    const chapterCount = hasValidSettings
        ? getProjectedChapterCount(
            project.targetWordCount,
            project.averageChapterLength
        )
        : 0;

    if (!templateNotes || chapterCount === 0) return null;

    const chapterNumber = chapter.order + 1;
    const actRanges = getActChapterRanges(template.acts, chapterCount);

    const actNotes = template.acts.flatMap((act, index) => {
        const range = actRanges[index];
        const note = templateNotes.actNotes?.[act.id]?.trim() ?? "";

        if (
            !range ||
            !note ||
            chapterNumber < range.start ||
            chapterNumber > range.end
        ) {
            return [];
        }

        return [{
            id: act.id,
            kind: "act",
            label: "Act Notes",
            title: `Act ${index + 1} · ${act.name}`,
            range,
            note,
        }];
    });

    const beatNotes = getStoryBeatChapterMappings(template, chapterCount)
        .filter(
            (beat) =>
                chapterNumber >= beat.chapterRange.start &&
                chapterNumber <= beat.chapterRange.end
        )
        .flatMap((beat) => {
            const note =
                templateNotes.beatNotes?.[beat.storyBeatId]?.trim() ?? "";

            if (!note) return [];

            return [{
                id: beat.storyBeatId,
                kind: "beat",
                label: "Story Beat Notes",
                title: beat.storyBeatName,
                range: beat.chapterRange,
                note,
            }];
        });

    const notes = [...actNotes, ...beatNotes];

    if (notes.length === 0) return null;

    return (
        <section
            className="chapter-structure-notes"
            aria-label="Story structure notes"
        >
            <header>
                <h3>Story Structure Notes</h3>
                <p>From Story Structure</p>
            </header>

            {notes.map((item) => (
                <article
                    key={`${item.kind}-${item.id}`}
                    className={`chapter-structure-note chapter-structure-note-${item.kind}`}
                >
                    <p className="chapter-structure-note-label">{item.label}</p>

                    <div className="chapter-structure-note-heading">
                        <h4>{item.title}</h4>
                        <span>{getChapterRangeLabel(item.range)}</span>
                    </div>

                    <p className="chapter-structure-note-text">{item.note}</p>
                </article>
            ))}
        </section>
    );
}