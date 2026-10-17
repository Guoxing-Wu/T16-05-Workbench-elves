import {
    STORY_STRUCTURE_OPTIONS,
    getStoryBeatCount,
} from "./storyStructureTemplate";

import type {
    StoryStructureId,
    StoryStructureTemplate,
} from "./storyStructureTemplate";

import { CustomStructureManager } from "./CustomStructureManager";

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
                <h2>Select a planning framework</h2>
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

            <section className="story-custom-structures-section">
                <div className="story-custom-structures-header">
                    <div>
                        <h3>Custom Structures</h3>

                        <p>
                            Create and reuse your own story planning
                            frameworks.
                        </p>
                    </div>
                </div>

                <CustomStructureManager
                    structures={customStructures}
                    compact
                    selectedStructureId={value}
                    onSelect={onChange}
                />
            </section>
        </section>
    );
}