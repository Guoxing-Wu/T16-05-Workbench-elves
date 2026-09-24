import {
    STORY_STRUCTURE_OPTIONS,
    getStoryBeatCount,
} from "./storyStructureTemplate";

import type {
    StoryStructureId,
    StoryStructureTemplate,
} from "./storyStructureTemplate";

type StoryTemplatePickerProps = {
    value: StoryStructureId;
    onChange: (templateId: StoryStructureId) => void;
    customStructures?: StoryStructureTemplate[];
};

export function StoryTemplatePicker({
    value,
    onChange,
    customStructures = [],
}: StoryTemplatePickerProps) {
    return (
        <section className="story-template-picker">
            <header className="story-template-picker-header">
                <div>
                    <span className="story-template-eyebrow">
                        STORY STRUCTURE TEMPLATES
                    </span>

                    <h2>Select a planning framework</h2>
                </div>
            </header>

            <section>
                <h3>Built-in Structures</h3>

                <div
                    className="story-template-grid"
                    role="group"
                    aria-label="Built-in story structure templates"
                >
                    {STORY_STRUCTURE_OPTIONS.map((option) => {
                        const isSelected =
                            option.id === value;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                className={
                                    isSelected
                                        ? "story-template-option is-selected"
                                        : "story-template-option"
                                }
                                aria-pressed={isSelected}
                                onClick={() =>
                                    onChange(option.id)
                                }
                            >
                                <span className="story-template-name">
                                    {option.name}
                                </span>

                                <span className="story-template-summary">
                                    {option.acts.length} acts ·{" "}
                                    {getStoryBeatCount(option)} story beats
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section>
                <h3>Custom Structures</h3>

                {customStructures.length === 0 ? (
                    <p>
                        No custom story structures available.
                    </p>
                ) : (
                    <div
                        className="story-template-grid"
                        role="group"
                        aria-label="Custom story structure templates"
                    >
                        {customStructures.map((structure) => {
                            const isSelected =
                                structure.id === value;

                            return (
                                <button
                                    key={structure.id}
                                    type="button"
                                    className={
                                        isSelected
                                            ? "story-template-option is-selected"
                                            : "story-template-option"
                                    }
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        onChange(structure.id)
                                    }
                                >
                                    <span className="story-template-name">
                                        {structure.name}
                                    </span>

                                    <span className="story-template-summary">
                                        {structure.acts.length} acts ·{" "}
                                        {getStoryBeatCount(structure)} story beats
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </section>
    );
}