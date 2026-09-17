import { Field, PageHeader } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import type { WritingProject } from "../../lib/domain";

import {
    getStoryStructureOption,
    STORY_STRUCTURE_OPTIONS,
} from "./storyStructureTemplate";

import type { StoryStructureId } from "./storyStructureTemplate";

// Data that must be provided when StoryStructurePage is displayed
type StoryStructurePageProps = {
    project: WritingProject;
};

// Displays and updates the story structure selected for the current project
export function StoryStructurePage({
    project,
}: StoryStructurePageProps) {
    const { updateProject } = useWorkbench();

    // Use the saved template ID to find its name and description
    const selectedTemplate = getStoryStructureOption(
        project.storyStructure
    );

    // Update only the story structure field of the current project
    const changeTemplate = (templateId: StoryStructureId) => {
        updateProject(project.id, (currentProject) => {
            return {
                // duplicate the title, words, chapters of all original project information, avoid cover other fields.
                ...currentProject,
                storyStructure: templateId,
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

            <article className="project-card">
                <Field label="Selected template">
                    <select
                        value={project.storyStructure}
                        onChange={(event) => {
                            changeTemplate(
                                event.target.value as StoryStructureId
                            );
                        }}
                    >
                        {STORY_STRUCTURE_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <h2>{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
            </article>
        </div>
    );
}