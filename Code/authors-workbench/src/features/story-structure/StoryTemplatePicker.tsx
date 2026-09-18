import {
    STORY_STRUCTURE_OPTIONS,
    getStoryBeatCount,
} from "./storyStructureTemplate";

import type { StoryStructureId } from "./storyStructureTemplate";

// Receive data and functions from StoryStructurePage.
type StoryTemplatePickerProps = {
    value: StoryStructureId;

    // User can select other template 
    onChange: (templateId: StoryStructureId) => void;
};

// Show template cards using the value and function
export function StoryTemplatePicker({
    value,
    onChange,
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

            {/* Keep the template buttons in one named group. */}
            <div
                className="story-template-grid"
                role="group"
                aria-label="Story structure templates"
            >
                {STORY_STRUCTURE_OPTIONS.map((option) => {
                    // Create one card for each template and check whether it matches the selected ID.
                    const isSelected = option.id === value;

                    // Use the template ID as the card's unique key and send it to the StoryTemplate page when clicked.
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
                            onClick={() => onChange(option.id)}
                        >
                            {/* Show template name, number of acts and story beats */}
                            <span className="story-template-name">
                                {option.name}
                            </span>

                            <span className="story-template-summary">
                                {option.acts.length} acts · {getStoryBeatCount(option)} story beats
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

