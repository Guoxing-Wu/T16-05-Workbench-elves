import { useEffect, useState } from "react";
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

    const [name, setName] = useState(
        structure?.name ?? ""
    );

    const [description, setDescription] = useState(
        structure?.description ?? ""
    );

    const [acts, setActs] = useState<StoryAct[]>(
        structure?.acts ?? []
    );

    const [storyBeats, setStoryBeats] = useState<StoryBeat[]>(
        structure?.storyBeats ?? []
    );

    useEffect(() => {
        setName(structure?.name ?? "");
        setDescription(structure?.description ?? "");
        setActs(structure?.acts ?? []);
        setStoryBeats(structure?.storyBeats ?? []);
    }, [structure]);

    /*
     * Add a new Act.
     *
     * New acts start with a 0-100% range so that the
     * user can define the exact position in the story.
     */
    const handleAddAct = () => {
        const actNumber = acts.length + 1;

        const newAct: StoryAct = {
            id: `act-${Date.now()}-${actNumber}`,
            name: `Act ${actNumber}`,
            startPercent: 0,
            endPercent: 100,
        };

        setActs((currentActs) => [
            ...currentActs,
            newAct,
        ]);
    };

    /* Add a Story Beat to an Act.*/
    const handleAddBeat = (actId: string) => {
        const selectedAct = acts.find((act) => act.id === actId);

        if (!selectedAct) {
            return;
        }

        const beatNumber =
            storyBeats.filter((beat) => beat.actId === actId).length + 1;

        const newBeat: StoryBeat = {
            id: `beat-${Date.now()}-${beatNumber}`,
            name: `Story Beat ${beatNumber}`,
            startPercent: selectedAct.startPercent,
            endPercent: selectedAct.endPercent,
            actId,
        };

        setStoryBeats((currentStoryBeats) => [
            ...currentStoryBeats,
            newBeat,
        ]);
    };

    const handleActNameChange = (
        actId: string,
        value: string
    ) => {
        setActs((currentActs) =>
            currentActs.map((act) =>
                act.id === actId
                    ? {
                        ...act,
                        name: value,
                    }
                    : act
            )
        );
    };

    const handleActStartChange = (
        actId: string,
        value: number
    ) => {
        setActs((currentActs) =>
            currentActs.map((act) =>
                act.id === actId
                    ? {
                        ...act,
                        startPercent: value,
                    }
                    : act
            )
        );
    };

    const handleActEndChange = (
        actId: string,
        value: number
    ) => {
        setActs((currentActs) =>
            currentActs.map((act) =>
                act.id === actId
                    ? {
                        ...act,
                        endPercent: value,
                    }
                    : act
            )
        );
    };

    const handleBeatNameChange = (
        beatId: string,
        value: string
    ) => {
        setStoryBeats((currentStoryBeats) =>
            currentStoryBeats.map((beat) =>
                beat.id === beatId
                    ? {
                        ...beat,
                        name: value,
                    }
                    : beat
            )
        );
    };

    const handleBeatStartChange = (
        beatId: string,
        value: number
    ) => {
        setStoryBeats((currentStoryBeats) =>
            currentStoryBeats.map((beat) =>
                beat.id === beatId
                    ? {
                        ...beat,
                        startPercent: value,
                    }
                    : beat
            )
        );
    };

    const handleBeatEndChange = (
        beatId: string,
        value: number
    ) => {
        setStoryBeats((currentStoryBeats) =>
            currentStoryBeats.map((beat) =>
                beat.id === beatId
                    ? {
                        ...beat,
                        endPercent: value,
                    }
                    : beat
            )
        );
    };


    /* Validate the structure before saving. */
    const hasValidActPercentages = acts.every(
        (act) =>
            act.startPercent >= 0 &&
            act.endPercent <= 100 &&
            act.startPercent < act.endPercent
    );

    const hasContinuousActRanges =
        acts.length > 0 &&
        acts[0].startPercent === 0 &&
        acts[acts.length - 1].endPercent === 100 &&
        acts.every(
            (act, index) =>
                index === 0 ||
                act.startPercent ===
                acts[index - 1].endPercent
        );

    const hasValidBeatPercentages = storyBeats.every(
        (beat) =>
            beat.startPercent >= 0 &&
            beat.endPercent <= 100 &&
            beat.startPercent <= beat.endPercent
    );

    const hasValidStructure =
        hasValidActPercentages &&
        hasContinuousActRanges &&
        hasValidBeatPercentages;

    const canSave =
        name.trim().length > 0 &&
        hasValidStructure;

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        const savedStructure: StoryStructureTemplate = {
            id:
                structure?.id ??
                `custom-${Date.now()}`,

            name: name.trim(),

            description: description.trim(),

            isCustom: true,

            acts,

            storyBeats,
        };

        onSave(savedStructure);
    };

    return (
        <section className="custom-structure-editor">
            <header className="custom-structure-editor-header">
                <div>
                    <span className="story-template-eyebrow">
                        CUSTOM STRUCTURE
                    </span>

                    <h2>
                        {isEditing
                            ? "Edit Custom Structure"
                            : "Create Custom Structure"}
                    </h2>

                    <p>
                        Define the acts and story beats
                        that make up your planning framework.
                    </p>
                </div>
            </header>

            <div className="custom-structure-editor-form">
                <label className="custom-structure-field">
                    <span>Structure Name</span>

                    <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="e.g. My Mystery Structure"
                    />
                </label>

                <label className="custom-structure-field">
                    <span>Description</span>

                    <textarea
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
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
                        {acts.length === 0 ? (
                            <p className="custom-structure-empty">
                                No acts yet. Add an act to
                                start building your structure.
                            </p>
                        ) : (
                            acts.map((act, actIndex) => {
                                const actStoryBeats = storyBeats.filter(
                                    (beat) => beat.actId === act.id
                                );

                                return (
                                    <article
                                        key={act.id}
                                        className="custom-structure-act"
                                    >
                                        <div className="custom-structure-act-header">
                                            <div>
                                                <span className="custom-structure-act-number">
                                                    ACT {actIndex + 1}
                                                </span>

                                                <input
                                                    className="custom-structure-act-name"
                                                    type="text"
                                                    value={act.name}
                                                    onChange={(event) =>
                                                        handleActNameChange(
                                                            act.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="custom-structure-range">
                                            <span className="custom-structure-range-label">
                                                Story Position
                                            </span>

                                            <div className="custom-structure-range-inputs">
                                                <label>
                                                    <span>
                                                        Start
                                                    </span>

                                                    <div className="percent-input">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={0.1}
                                                            value={
                                                                act.startPercent
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleActStartChange(
                                                                    act.id,
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            %
                                                        </span>
                                                    </div>
                                                </label>

                                                <span className="range-separator">
                                                    →
                                                </span>

                                                <label>
                                                    <span>
                                                        End
                                                    </span>

                                                    <div className="percent-input">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={0.1}
                                                            value={
                                                                act.endPercent
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleActEndChange(
                                                                    act.id,
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            %
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="custom-structure-beats">
                                            <div className="custom-structure-beats-header">
                                                <h4>
                                                    Story Beats
                                                </h4>

                                                <span>
                                                    {actStoryBeats.length} beats
                                                </span>
                                            </div>

                                            {actStoryBeats.map(
                                                (
                                                    beat,
                                                    beatIndex
                                                ) => (
                                                    <div
                                                        key={
                                                            beat.id
                                                        }
                                                        className="custom-structure-beat"
                                                    >
                                                        <div className="custom-structure-beat-number">
                                                            {beatIndex +
                                                                1}
                                                        </div>

                                                        <div className="custom-structure-beat-content">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    beat.name
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleBeatNameChange(
                                                                        beat.id,
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />

                                                            <div className="custom-structure-range-inputs custom-structure-beat-range">
                                                                <label>
                                                                    <span>
                                                                        Start
                                                                    </span>

                                                                    <div className="percent-input">
                                                                        <input
                                                                            type="number"
                                                                            min={
                                                                                0
                                                                            }
                                                                            max={
                                                                                100
                                                                            }
                                                                            step={
                                                                                0.1
                                                                            }
                                                                            value={
                                                                                beat.startPercent
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleBeatStartChange(
                                                                                    beat.id,
                                                                                    Number(event.target.value)
                                                                                )
                                                                            }
                                                                        />

                                                                        <span>
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </label>

                                                                <span className="range-separator">
                                                                    →
                                                                </span>

                                                                <label>
                                                                    <span>
                                                                        End
                                                                    </span>

                                                                    <div className="percent-input">
                                                                        <input
                                                                            type="number"
                                                                            min={
                                                                                0
                                                                            }
                                                                            max={
                                                                                100
                                                                            }
                                                                            step={
                                                                                0.1
                                                                            }
                                                                            value={
                                                                                beat.endPercent
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleBeatEndChange(
                                                                                    beat.id,
                                                                                    Number(event.target.value)
                                                                                )
                                                                            }
                                                                        />

                                                                        <span>
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}

                                            <button
                                                type="button"
                                                className="custom-structure-add-button"
                                                onClick={() =>
                                                    handleAddBeat(
                                                        act.id
                                                    )
                                                }
                                            >
                                                + Add Story Beat
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}

                        <button
                            type="button"
                            className="custom-structure-add-button add-act-button"
                            onClick={handleAddAct}
                        >
                            + Add Act
                        </button>
                    </div>
                </div>
            </div>

            {!hasValidStructure && (
                <p className="custom-structure-validation">
                    Unable to save this structure. Check the Acts
                    and Story Beat ranges, then try again.
                </p>
            )}

            <div className="custom-structure-form-actions">
                <button
                    type="button"
                    onClick={onCancel}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    {isEditing
                        ? "Save Changes"
                        : "Create Structure"}
                </button>
            </div>
        </section>
    );
}