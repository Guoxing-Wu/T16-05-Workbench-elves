import type { StoryStructureTemplate } from "./storyStructureTemplate";
import type { StoryTemplateNotes } from "../../lib/domain";

import {
    getActChapterRanges,
    getBeatChapterRange,
    getChapterRangeLabel,
    getPercentRangeLabel,
} from "./storyChapterMapping";

// Receive structure, notes and update functions from the page.
type StoryActListProps = {
    template: StoryStructureTemplate;
    chapterCount: number;
    notes: StoryTemplateNotes;
    onActNoteChange: (actId: string, value: string) => void;
    onBeatNoteChange: (beatId: string, value: string) => void;
};

// Display the template structure
export function StoryActList({ template, chapterCount, notes, onActNoteChange, onBeatNoteChange, }: StoryActListProps) {
    const { acts, storyBeats } = template;
    const actRanges = getActChapterRanges(
        acts, chapterCount);
    return (
        <section className="story-structure-board">
            {chapterCount < acts.length && (
                <p className="story-mapping-note">
                    Plan at least {acts.length} chapters to map every act.
                </p>
            )}
            {/* Show an overview information for each act */}
            <div className="story-act-overview">
                {acts.map((act, index) => (
                    <div
                        key={act.id}
                        className={
                            "story-act-overview-item story-act-" +
                            (index + 1)
                        }
                    >
                        <span>ACT {index + 1}</span>
                        <strong>{act.name}</strong>
                        <span>
                            {getChapterRangeLabel(actRanges[index])}
                        </span>
                    </div>
                ))}
            </div>

            {/* Show each act with its own story beat content */}

            {acts.map((act, index) => {
                // Get the chapter range of the current act.
                const actRange = actRanges[index];

                const actStoryBeats = storyBeats.filter(
                    (beat) => beat.actId === act.id
                );

                return (
                    <section
                        key={act.id}
                        className={
                            "story-act-group story-act-" + (index + 1)
                        }
                    >
                        <header className="story-act-header">
                            <div>
                                <span className="story-template-eyebrow">
                                    ACT {index + 1} ·{" "}
                                    {getPercentRangeLabel(
                                        act.startPercent, act.endPercent
                                    )}
                                </span>
                                <h3>{act.name}</h3>
                            </div>

                            <span className="story-act-count">
                                {getChapterRangeLabel(actRange)}
                            </span>
                        </header>

                        {/* Remain the template title and let the author write act notes. */}
                        <label className="story-act-notes">
                            <span className="story-note-label">ACT NOTES</span>

                            <textarea
                                rows={2}
                                value={notes.actNotes[act.id] || ""}
                                placeholder="Write your act notes..."
                                onChange={(event) =>
                                    onActNoteChange(act.id, event.target.value)
                                }
                            />
                        </label>

                        <p className="story-act-description">
                            {actStoryBeats.length} story beats
                        </p>


                        <div className="story-beat-grid">
                            {actStoryBeats.map((beat) => {
                                // Calculate chapters only when the project has chapters.
                                const beatRange =
                                    chapterCount > 0
                                        ? getBeatChapterRange(
                                            beat,
                                            chapterCount
                                        )
                                        : undefined;
                                return (
                                    <article
                                        key={beat.id}
                                        className="story-beat-card"
                                    >
                                        <div className="story-beat-position">
                                            <span>
                                                {getChapterRangeLabel(
                                                    beatRange
                                                )}
                                            </span>

                                            <span>
                                                {getPercentRangeLabel(
                                                    beat.startPercent,
                                                    beat.endPercent
                                                )}
                                            </span>
                                        </div>

                                        <h4>{beat.name}</h4>

                                        {/* Link the note to the beat ID */}
                                        <label className="story-beat-notes">
                                            <span className="story-note-label">NOTES</span>

                                            <textarea
                                                rows={3}
                                                value={notes.beatNotes[beat.id] || ""}
                                                placeholder="Write your story beat notes..."
                                                onChange={(event) =>
                                                    onBeatNoteChange(beat.id, event.target.value)
                                                }
                                            />
                                        </label>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </section>
    );
}