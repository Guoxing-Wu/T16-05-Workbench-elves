/*export type StoryStructureId =
    | "three-act"
    | "heros-journey"
    | "save-the-cat";*/

export type StoryStructureId = string;
export type StoryBeat = {
    id: string;
    name: string;
    startPercent: number;
    endPercent: number;
};

// Each act contains a list of story beats
export type StoryAct = {
    id: string;
    name: string;
    startPercent: number;
    endPercent: number;
    storyBeats: StoryBeat[];
};

export type StoryStructureTemplate = {
    id: StoryStructureId;
    name: string;
    description: string;
    acts: StoryAct[];
    isCustom?: boolean; // Specify whether the structure is customised
};

// Convert position in a 110 page screenplay into percentage（Save the Cat）
function pageToPercent(page: number) {
    return page / 110 * 100;
}

// Display the detailed data for three story structure templates 
export const STORY_STRUCTURE_OPTIONS: StoryStructureTemplate[] = [
    {
        id: "three-act",
        name: "Three-Act Structure",
        description:
            "Divide the story into Setup, Confrontation and Resolution.",
        acts: [
            {
                id: "ta-act1",
                name: "Setup",
                startPercent: 0,
                endPercent: 25,
                storyBeats: [
                    {
                        id: "ta-exposition",
                        name: "Exposition",
                        startPercent: 0,
                        endPercent: 10,
                    },
                    {
                        id: "ta-inciting-incident",
                        name: "Inciting Incident",
                        startPercent: 10,
                        endPercent: 10,
                    },
                    {
                        id: "ta-plot-point1",
                        name: "Plot Point One",
                        startPercent: 25,
                        endPercent: 25,
                    },
                ],
            },
            {
                id: "ta-act2",
                name: "Confrontation",
                startPercent: 25,
                endPercent: 75,
                storyBeats: [
                    {
                        id: "ta-rising-action",
                        name: "Rising Action",
                        startPercent: 25,
                        endPercent: 50,
                    },
                    {
                        id: "ta-midpoint",
                        name: "Midpoint",
                        startPercent: 50,
                        endPercent: 50,
                    },
                    {
                        id: "ta-plot-point2",
                        name: "Plot Point Two",
                        startPercent: 75,
                        endPercent: 75,
                    },
                ],
            },
            {
                id: "ta-act3",
                name: "Resolution",
                startPercent: 75,
                endPercent: 100,
                storyBeats: [
                    {
                        id: "ta-pre-climax",
                        name: "Pre-Climax",
                        startPercent: 75,
                        endPercent: 85,
                    },
                    {
                        id: "ta-climax",
                        name: "Climax",
                        startPercent: 85,
                        endPercent: 95,
                    },
                    {
                        id: "ta-denouement",
                        name: "Denouement",
                        startPercent: 95,
                        endPercent: 100,
                    },
                ],
            },
        ],
    },
    {
        id: "heros-journey",
        name: "Hero's Journey",
        description:
            "Follow a hero who leaves the ordinary world, faces trials and returns transformed.",
        acts: [
            {
                id: "hj-act1",
                name: "Act One",
                startPercent: 0,
                endPercent: 25,
                storyBeats: [
                    {
                        id: "hj-ordinary-world",
                        name: "The Ordinary World",
                        startPercent: 0,
                        endPercent: 5,
                    },
                    {
                        id: "hj-call",
                        name: "Call to Adventure",
                        startPercent: 10,
                        endPercent: 10,
                    },
                    {
                        id: "hj-refusal",
                        name: "Refusal of the Call",
                        startPercent: 12,
                        endPercent: 15,
                    },
                    {
                        id: "hj-meeting",
                        name: "Meeting the Mentor",
                        startPercent: 20,
                        endPercent: 20,
                    },
                    {
                        id: "hj-threshold",
                        name: "Crossing the First Threshold",
                        startPercent: 25,
                        endPercent: 25,
                    },
                ],
            },
            {
                id: "hj-act2",
                name: "Act Two",
                startPercent: 25,
                endPercent: 75,
                storyBeats: [
                    {
                        id: "hj-tests",
                        name: "Tests, Allies, Enemies",
                        startPercent: 25,
                        endPercent: 40,
                    },
                    {
                        id: "hj-approach",
                        name: "Approach to the Inmost Cave",
                        startPercent: 45,
                        endPercent: 55,
                    },
                    {
                        id: "hj-ordeal",
                        name: "Ordeal",
                        startPercent: 60,
                        endPercent: 60,
                    },
                    {
                        id: "hj-reward",
                        name: "Reward (Seizing the Sword)",
                        startPercent: 70,
                        endPercent: 70,
                    },
                ],
            },
            {
                id: "hj-act3",
                name: "Act Three",
                startPercent: 75,
                endPercent: 100,
                storyBeats: [
                    {
                        id: "hj-road-back",
                        name: "The Road Back",
                        startPercent: 75,
                        endPercent: 75,
                    },
                    {
                        id: "hj-resurrection",
                        name: "Resurrection",
                        startPercent: 90,
                        endPercent: 90,
                    },
                    {
                        id: "hj-return-elixir",
                        name: "Return with the Elixir",
                        startPercent: 100,
                        endPercent: 100,
                    },
                ],
            },
        ],
    },
    {
        id: "save-the-cat",
        name: "Save the Cat",
        description:
            "Use a three-act framework with 15 story beats.",
        acts: [
            {
                id: "sat-act1",
                name: "Act One",
                startPercent: 0,
                endPercent: pageToPercent(25),
                storyBeats: [
                    {
                        id: "sat-opening-image",
                        name: "Opening Image",
                        startPercent: pageToPercent(1),
                        endPercent: pageToPercent(1),
                    },
                    {
                        id: "sat-theme-stated",
                        name: "Theme Stated",
                        startPercent: pageToPercent(5),
                        endPercent: pageToPercent(5),
                    },
                    {
                        id: "sat-set-up",
                        name: "Set-up",
                        startPercent: pageToPercent(1),
                        endPercent: pageToPercent(10),
                    },
                    {
                        id: "sat-catalyst",
                        name: "Catalyst",
                        startPercent: pageToPercent(12),
                        endPercent: pageToPercent(12),
                    },
                    {
                        id: "sat-debate",
                        name: "Debate",
                        startPercent: pageToPercent(12),
                        endPercent: pageToPercent(25),
                    },
                ],
            },
            {
                id: "sat-act2",
                name: "Act Two",
                startPercent: pageToPercent(25),
                endPercent: pageToPercent(85),
                storyBeats: [
                    {
                        id: "sat-break-into-two",
                        name: "Break Into Two",
                        startPercent: pageToPercent(25),
                        endPercent: pageToPercent(25),
                    },
                    {
                        id: "sat-b-story",
                        name: "B Story",
                        startPercent: pageToPercent(30),
                        endPercent: pageToPercent(30),
                    },
                    {
                        id: "sat-fun-and-games",
                        name: "Fun and Games",
                        startPercent: pageToPercent(30),
                        endPercent: pageToPercent(55),
                    },
                    {
                        id: "sat-midpoint",
                        name: "Midpoint",
                        startPercent: pageToPercent(55),
                        endPercent: pageToPercent(55),
                    },
                    {
                        id: "sat-bad-guys",
                        name: "Bad Guys Close In",
                        startPercent: pageToPercent(55),
                        endPercent: pageToPercent(75),
                    },
                    {
                        id: "sat-all-lost",
                        name: "All Is Lost",
                        startPercent: pageToPercent(75),
                        endPercent: pageToPercent(75),
                    },
                    {
                        id: "sat-dark-night",
                        name: "Dark Night of the Soul",
                        startPercent: pageToPercent(75),
                        endPercent: pageToPercent(85),
                    },
                ],
            },
            {
                id: "sat-act3",
                name: "Act Three",
                startPercent: pageToPercent(85),
                endPercent: 100,
                storyBeats: [
                    {
                        id: "sat-break-into-three",
                        name: "Break Into Three",
                        startPercent: pageToPercent(85),
                        endPercent: pageToPercent(85),
                    },
                    {
                        id: "sat-finale",
                        name: "Finale",
                        startPercent: pageToPercent(85),
                        endPercent: pageToPercent(110),
                    },
                    {
                        id: "sat-final-image",
                        name: "Final Image",
                        startPercent: pageToPercent(110),
                        endPercent: pageToPercent(110),
                    },
                ],
            },
        ],
    },
];


// Three act as the default template when creating a new project
export const DEFAULT_STORY_STRUCTURE_ID: StoryStructureId =
    "three-act";


// Add the story beats counts from every act
export function getStoryBeatCount(template: StoryStructureTemplate) {
    let count = 0;

    for (const act of template.acts) {
        count += act.storyBeats.length;
    }

    return count;
}


// Finds and returns the Story Structure that matches the supplied ID
export function getStoryStructureOption(
    id: StoryStructureId,
    customStructures: StoryStructureTemplate[] = []
) {
    // First look for a built-in structure
    const builtIn = STORY_STRUCTURE_OPTIONS.find(
        (option) => option.id === id
    );

    if (builtIn) {
        return builtIn;
    }

    // If not built-in, look for a custom structure
    const custom = customStructures.find(
        (structure) => structure.id === id
    );

    return custom ?? STORY_STRUCTURE_OPTIONS[0];
}