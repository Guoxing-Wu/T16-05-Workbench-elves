// Display the detailed data for three story structure templates 
export const STORY_STRUCTURE_OPTIONS = [
    {
        id: "three-act",
        name: "Three-Act Structure",
        description: "Divide the story into Setup, Confrontation and Resolution.",
        summary: "3 acts · 9 story beats",
    },
    {
        id: "heros-journey",
        name: "Hero's Journey",
        description: "Follow a hero who leaves the ordinary world, faces trials and returns transformed.",
        summary: "3 acts · 12 story beats",
    },
    {
        id: "save-the-cat",
        name: "Save the Cat",
        description: "Use a three-act framework expanded into 15 named story beats with suggested positions.",
        summary: "3 acts · 15 story beats",
    },
] as const;

// Creates a type containing every valid story structure ID
export type StoryStructureId =
    (typeof STORY_STRUCTURE_OPTIONS)[number]["id"];

// Initialising selected template selected when the new-project form opens
export const DEFAULT_STORY_STRUCTURE_ID: StoryStructureId =
    "three-act";

// Finds and returns the Story Structure that matches the supplied ID
export function getStoryStructureOption(id: StoryStructureId) {
    for (const option of STORY_STRUCTURE_OPTIONS) {
        if (option.id === id) {
            return option;
        }
    }

    // Return the first template if no matching ID is found.
    return STORY_STRUCTURE_OPTIONS[0];
}