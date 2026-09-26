import { PageHeader } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import type { WritingProject, StoryTemplateNotes, } from "../../lib/domain";

import { StoryTemplatePicker } from "./StoryTemplatePicker";
import { getStoryStructureOption } from "./storyStructureTemplate";
import type { StoryStructureId } from "./storyStructureTemplate";
import { StoryActList } from "./StoryActList";
import "./storyStructure.css";
import { getProjectedChapterCount, } from "./storyChapterMapping";
import { CustomStructureManager } from "./CustomStructureManager";
import { Library, Network } from "lucide-react";

// Data that must be provided when StoryStructurePage is displayed
type StoryStructurePageProps = {
    // The project is optional because custom story structures can be managed without an active writing project.
    project?: WritingProject;
};

// Displays and updates the story structure selected for the current project
export function StoryStructurePage({
    project,
}: StoryStructurePageProps) {
    const {
    updateProject,
    // Custom structures are global Workbench resources, therefore available even when no project is open.
    customStoryStructures,
} = useWorkbench();

// Display custom story structure if no project is selected
if (!project) {
        return (
            <div className="page-stack core-page story-structure-page">
                <PageHeader
                    eyebrow="MANUSCRIPT"
                    title="Story Structure"
                    count="Create reusable structures for your story planning."
                />

                <section className="story-structure-library">
                    <header className="story-structure-library-header">
                        <div className="story-structure-library-heading">
                            <div className="story-structure-library-icon">
                                <Library size={20} />
                            </div>

                            <div>
                                <span className="story-section-eyebrow">
                                    STRUCTURE LIBRARY
                                </span>

                                <h2>Build your own story framework</h2>

                                <p>
                                    Create reusable planning structures with
                                    your own acts and story beats.
                                </p>
                            </div>
                        </div>
                    </header>

                    <CustomStructureManager
                        structures={customStoryStructures}
                    />
                </section>

                <section className="story-project-placeholder">
                    <div className="story-project-placeholder-icon">
                        <Network size={22} />
                    </div>

                    <div className="story-project-placeholder-content">
                        <span className="story-section-eyebrow">
                            PROJECT STRUCTURE
                        </span>

                        <h2>Open a project to start planning</h2>

                        <p>
                            Select a project to choose a story structure and
                            work through its acts, beats, and chapter plan.
                        </p>
                    </div>
                </section>
            </div>
        );
    }
    // Use the saved template ID to find its name and description
    // When project is selected, show the built in and customised structure
    const selectedTemplate = getStoryStructureOption(
        project.storyStructure,
        customStoryStructures
    );

    // Read template's notes or show empty fields.
    const selectedNotes: StoryTemplateNotes =
        project.storyStructureNotes?.[selectedTemplate.id] || {
            actNotes: {},
            beatNotes: {},
        };

    // Both values must be whole numbers greater than 0.
    const hasValidSettings =
        Number.isInteger(project.targetWordCount) &&
        project.targetWordCount > 0 &&
        Number.isInteger(project.averageChapterLength) &&
        project.averageChapterLength > 0;

    // Recalculate projected chapters when the settings change.
    const chapterCount = hasValidSettings
        ? getProjectedChapterCount(
            project.targetWordCount,
            project.averageChapterLength
        )
        : 0;

    // Update only the story structure field of the current project
    const changeTemplate = (templateId: StoryStructureId) => {
        updateProject(project.id, (currentProject) => {
            return {
                // Remain other project fields and change only the template ID.
                ...currentProject,
                storyStructure: templateId,
            };
        });
    };

    // Update the target word count and keep other project data.
    const changeTargetWordCount = (value: number) => {
        updateProject(project.id, (currentProject) => {
            return {
                ...currentProject,
                targetWordCount: value,
            };
        });
    };

    // Update the average chapter length without changing actual chapters.
    const changeAverageChapterLength = (value: number) => {
        updateProject(project.id, (currentProject) => {
            return {
                ...currentProject,
                averageChapterLength: value,
            };
        });
    };

    // Update one act note without replacing other notes.
    const changeActNote = (actId: string, value: string) => {
        const templateId = selectedTemplate.id;

        updateProject(project.id, (currentProject) => {
            const allNotes = currentProject.storyStructureNotes || {};
            const templateNotes = allNotes[templateId] || {
                actNotes: {},
                beatNotes: {},
            };

            return {
                ...currentProject,
                storyStructureNotes: {
                    ...allNotes,
                    [templateId]: {
                        ...templateNotes,
                        actNotes: {
                            ...templateNotes.actNotes,
                            [actId]: value,
                        },
                    },
                },
            };
        });
    };

    // Update one story beat note without replacing other notes.
    const changeBeatNote = (beatId: string, value: string) => {
        const templateId = selectedTemplate.id;

        updateProject(project.id, (currentProject) => {
            const allNotes = currentProject.storyStructureNotes || {};
            const templateNotes = allNotes[templateId] || {
                actNotes: {},
                beatNotes: {},
            };

            return {
                ...currentProject,
                storyStructureNotes: {
                    ...allNotes,
                    [templateId]: {
                        ...templateNotes,
                        beatNotes: {
                            ...templateNotes.beatNotes,
                            [beatId]: value,
                        },
                    },
                },
            };
        });
    };

    return (
        <div className="page-stack core-page">
            <PageHeader
                eyebrow="MANUSCRIPT"
                title="Story Structure"
                count="Choose the planning structure for this project."
            />

            {/* Show template cards and connect them to the project */}
            <StoryTemplatePicker
                value={project.storyStructure}
                onChange={changeTemplate}
                customStructures={customStoryStructures}
            />

            {/* Edit word counts and show the projected chapter count. */}
            <section className="story-plan-summary">
                <div>
                    <label htmlFor="story-target-words">
                        <span>TARGET WORDS</span>
                    </label>

                    <input
                        id="story-target-words"
                        type="number"
                        min="1"
                        step="1"
                        value={project.targetWordCount || ""}
                        onChange={(event) =>
                            changeTargetWordCount(
                                Number(event.target.value)
                            )
                        }
                    />
                </div>

                <div>
                    <label htmlFor="story-average-chapter">
                        <span>AVG. CHAPTER</span>
                    </label>

                    <input
                        id="story-average-chapter"
                        type="number"
                        min="1"
                        step="1"
                        value={project.averageChapterLength || ""}
                        onChange={(event) =>
                            changeAverageChapterLength(
                                Number(event.target.value)
                            )
                        }
                    />
                </div>

                <div>
                    <span>PROJECTED PLAN</span>

                    <strong>
                        {hasValidSettings
                            ? chapterCount + " chapters"
                            : "—"}
                    </strong>
                </div>
            </section>

            {!hasValidSettings && (
                <p className="story-settings-error">
                    Enter whole numbers greater than 0.
                </p>
            )}

            {/* Show name and description of the selected template */}
            <section
                className="story-template-detail"
                aria-live="polite"
            >
                <h2>{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
            </section>

            {/* Display the selected template has its own acts */}
            <StoryActList
                acts={selectedTemplate.acts}
                chapterCount={chapterCount}
                notes={selectedNotes}
                onActNoteChange={changeActNote}
                onBeatNoteChange={changeBeatNote}
            />
        </div>
    );
}