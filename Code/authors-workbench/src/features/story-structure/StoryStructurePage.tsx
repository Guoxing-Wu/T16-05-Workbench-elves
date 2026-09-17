import { PageHeader } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import type { WritingProject } from "../../lib/domain";

import { StoryTemplatePicker } from "./StoryTemplatePicker";
import { getStoryStructureOption } from "./storyStructureTemplate";
import type { StoryStructureId } from "./storyStructureTemplate";
import "./storyStructure.css";


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
                // Remain other project fields and change only the template ID.
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
            {/* Show template cards and connect them to the project */}
            <StoryTemplatePicker
                value={project.storyStructure}
                onChange={changeTemplate}
            />

            {/* Show name and description of the selected template */}
            <section
                className="story-template-detail"
                aria-live="polite"
            >
                <h2>{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
            </section>
        </div>
    );
}