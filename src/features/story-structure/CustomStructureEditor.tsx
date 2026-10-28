import { useState } from "react";
import "./CustomStoryStructure.css";
import type {
    StoryStructureTemplate,
    StoryAct,
    StoryBeat,
} from "./storyStructureTemplate";

type CustomStructureEditorProps = {
    structure?: StoryStructureTemplate;
    onSave: (structure: StoryStructureTemplate) => void;
    onCancel: () => void;
};

export function CustomStructureEditor({
    structure,
    onSave,
    onCancel,
}: CustomStructureEditorProps) {
    const isEditing = Boolean(structure);
    const [name, setName] = useState(structure?.name ?? "");
    const [description, setDescription] = useState(structure?.description ?? "");
    const [acts, setActs] = useState<StoryAct[]>(structure?.acts ?? []);
    const [storyBeats, setStoryBeats] = useState<StoryBeat[]>(
        structure?.storyBeats ?? []
    );

    const independentBeats = storyBeats.filter(
        (beat) => !acts.some((act) => act.id === beat.actId)
    );

    const handleAddAct = () => {
        const actNumber = acts.length + 1;
        setActs((currentActs) => [
            ...currentActs,
            {
                id: `act-${Date.now()}-${actNumber}`,
                name: `Act ${actNumber}`,
                startPercent: 0,
                endPercent: 100,
            },
        ]);
    };

    // An act supplies initial values only; it does not constrain the beat's range.
    const handleAddBeat = (actId?: string) => {
        const act = acts.find((item) => item.id === actId);
        const beatNumber = storyBeats.length + 1;

        setStoryBeats((currentBeats) => [
            ...currentBeats,
            {
                id: `beat-${Date.now()}-${beatNumber}`,
                name: `Story Beat ${beatNumber}`,
                startPercent: act?.startPercent ?? 0,
                endPercent: act?.endPercent ?? 0,
                actId: act?.id,
            },
        ]);
    };

    const updateAct = (actId: string, changes: Partial<StoryAct>) => {
        setActs((currentActs) => currentActs.map(
            (act) => act.id === actId ? { ...act, ...changes } : act
        ));
    };

    const updateBeat = (beatId: string, changes: Partial<StoryBeat>) => {
        setStoryBeats((currentBeats) => currentBeats.map(
            (beat) => beat.id === beatId ? { ...beat, ...changes } : beat
        ));
    };

    const hasValidActPercentages = acts.every(
        (act) => act.startPercent >= 0 &&
            act.endPercent <= 100 &&
            act.startPercent < act.endPercent
    );

    const hasContinuousActRanges = acts.length > 0 &&
        acts[0].startPercent === 0 &&
        acts[acts.length - 1].endPercent === 100 &&
        acts.every((act, index) =>
            index === 0 || act.startPercent === acts[index - 1].endPercent
        );

    // Beats may be points or ranges anywhere in the story, with or without an act.
    const hasValidBeatPercentages = storyBeats.every(
        (beat) => beat.startPercent >= 0 &&
            beat.endPercent <= 100 &&
            beat.startPercent <= beat.endPercent
    );

    const hasValidStructure = hasValidActPercentages &&
        hasContinuousActRanges && hasValidBeatPercentages;

    const canSave = name.trim().length > 0 && hasValidStructure;

    const handleSave = () => {
        if (!canSave) return;

        onSave({
            id: structure?.id ?? `custom-${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            isCustom: true,
            acts,
            storyBeats,
        });
    };

    // Use the same percentage inputs for acts and beats.
    function renderRangeInputs(
        start: number,
        end: number,
        onChange: (start: number, end: number) => void,
        className = ""
    ) {
        return (
            <div className={"custom-structure-range-inputs " + className}>
                <label>
                    <span>Start</span>
                    <div className="percent-input">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={start}
                            onChange={(event) =>
                                onChange(Number(event.target.value), end)
                            }
                        />
                        <span>%</span>
                    </div>
                </label>

                <span className="range-separator">→</span>

                <label>
                    <span>End</span>
                    <div className="percent-input">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={end}
                            onChange={(event) =>
                                onChange(start, Number(event.target.value))
                            }
                        />
                        <span>%</span>
                    </div>
                </label>
            </div>
        );
    }

    function renderBeat(beat: StoryBeat, index: number) {
        return (
            <div key={beat.id} className="custom-structure-beat">
                <div className="custom-structure-beat-number">
                    {index + 1}
                </div>

                <div className="custom-structure-beat-content">
                    <input
                        type="text"
                        aria-label="Story beat name"
                        value={beat.name}
                        onChange={(event) =>
                            updateBeat(beat.id, { name: event.target.value })
                        }
                    />

                    {renderRangeInputs(
                        beat.startPercent,
                        beat.endPercent,
                        (startPercent, endPercent) =>
                            updateBeat(beat.id, { startPercent, endPercent }),
                        "custom-structure-beat-range"
                    )}

                    <label className="custom-structure-field custom-structure-beat-act">
                        <span>Act (optional)</span>
                        <select
                            value={beat.actId ?? ""}
                            onChange={(event) => updateBeat(beat.id, {
                                actId: event.target.value || undefined,
                            })}
                        >
                            <option value="">No act</option>
                            {acts.map((act, actIndex) => (
                                <option key={act.id} value={act.id}>
                                    Act {actIndex + 1}: {act.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
        );
    }

    return (
        <section className="custom-structure-editor">
            <header className="custom-structure-editor-header">
                <span className="story-template-eyebrow">
                    CUSTOM STRUCTURE
                </span>
                <h2>
                    {isEditing
                        ? "Edit Custom Structure"
                        : "Create Custom Structure"}
                </h2>
                <p>
                    Define the acts and story beats that make up your planning framework.
                </p>
            </header>

            <div className="custom-structure-editor-form">
                <label className="custom-structure-field">
                    <span>Structure Name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. My Mystery Structure"
                    />
                </label>

                <label className="custom-structure-field">
                    <span>Description</span>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Describe this story structure..."
                        rows={3}
                    />
                </label>

                <div className="custom-structure-section">
                    <div className="custom-structure-section-header">
                        <div>
                            <span className="story-template-eyebrow">
                                STORY FRAMEWORK
                            </span>
                            <h3>Acts & Story Beats</h3>
                        </div>
                    </div>

                    <div className="custom-structure-acts">
                        {acts.length === 0 && (
                            <p className="custom-structure-empty">
                                No acts yet. Add an act to start building your structure.
                            </p>
                        )}

                        {acts.map((act, actIndex) => {
                            const actBeats = storyBeats.filter(
                                (beat) => beat.actId === act.id
                            );

                            return (
                                <article key={act.id} className="custom-structure-act">
                                    <div className="custom-structure-act-header">
                                        <div>
                                            <span className="custom-structure-act-number">
                                                ACT {actIndex + 1}
                                            </span>
                                            <input
                                                className="custom-structure-act-name"
                                                type="text"
                                                aria-label="Act name"
                                                value={act.name}
                                                onChange={(event) => updateAct(act.id, {
                                                    name: event.target.value,
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div className="custom-structure-range">
                                        <span className="custom-structure-range-label">
                                            Story Position
                                        </span>

                                        {renderRangeInputs(
                                            act.startPercent,
                                            act.endPercent,
                                            (startPercent, endPercent) =>
                                                updateAct(act.id, { startPercent, endPercent })
                                        )}
                                    </div>

                                    <div className="custom-structure-beats">
                                        <div className="custom-structure-beats-header">
                                            <h4>Story Beats</h4>
                                            <span>{actBeats.length} beats</span>
                                        </div>

                                        {actBeats.map(renderBeat)}

                                        <button
                                            type="button"
                                            className="custom-structure-add-button"
                                            onClick={() => handleAddBeat(act.id)}
                                        >
                                            + Add Story Beat
                                        </button>
                                    </div>
                                </article>
                            );
                        })}

                        <button
                            type="button"
                            className="custom-structure-add-button add-act-button"
                            onClick={handleAddAct}
                        >
                            + Add Act
                        </button>

                        <section
                            className="custom-structure-act custom-structure-beats"
                            aria-label="Story beats without an act"
                        >
                            <div className="custom-structure-beats-header">
                                <h4>Story Beats without an Act</h4>
                                <span>{independentBeats.length} beats</span>
                            </div>

                            {independentBeats.length === 0 && (
                                <p className="custom-structure-empty">
                                    No story beats added here yet.
                                </p>
                            )}

                            {independentBeats.map(renderBeat)}

                            <button
                                type="button"
                                className="custom-structure-add-button"
                                onClick={() => handleAddBeat()}
                            >
                                + Add Story Beat
                            </button>
                        </section>
                    </div>
                </div>
            </div>

            {!hasValidStructure && (
                <p className="custom-structure-validation">
                    Unable to save this structure. Check the Acts and Story Beat ranges, then try again.
                </p>
            )}

            <div className="custom-structure-form-actions">
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={!canSave}>
                    {isEditing ? "Save Changes" : "Create Structure"}
                </button>
            </div>
        </section>
    );
}