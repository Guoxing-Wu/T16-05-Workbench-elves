import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { WritingProject } from "../../lib/domain";
import { StoryStructurePage } from "./StoryStructurePage";

const TEST_PROJECT: WritingProject = {
    id: "project-a",
    title: "Story Structure Test",
    targetWordCount: 60000,
    averageChapterLength: 3000,
    storyStructure: "three-act",
    storyStructureNotes: {},
    chapters: [],
    characters: [],
    locations: [],
    events: [],
    scenes: [],
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
};

const mockUpdateProject = jest.fn<
    (
        id: string,
        updater: (project: WritingProject) => WritingProject
    ) => void
>();

// Isolate page behavior from persistence; the helper applies the real update callback.
jest.mock("../../lib/store", () => ({
    useWorkbench: () => ({
        updateProject: mockUpdateProject,
        customStoryStructures: [],
    }),
}));

// Custom template management is outside the current test scope.
jest.mock("./CustomStructureManager", () => ({
    CustomStructureManager: () => null,
}));

// The current Jest configuration does not transform CSS imports.
jest.mock("./storyStructure.css", () => ({}));

beforeEach(() => {
    mockUpdateProject.mockReset();
});

function renderStoryStructurePage(
    initialProject: WritingProject = TEST_PROJECT
) {
    let project = initialProject;
    const user = userEvent.setup();
    const view = render(<StoryStructurePage project={project} />);

    // Apply the page's updater and render the resulting project state.
    mockUpdateProject.mockImplementation((id, updater) => {
        if (id !== project.id) {
            throw new Error(`Unexpected project update: ${id}`);
        }

        project = updater(project);
        view.rerender(<StoryStructurePage project={project} />);
    });

    return {
        ...view,
        user,
        getProject: () => project,
    };
}

// Scope act assertions because chapter labels also appear in the overview.
function getActContent(name: string) {
    const section = screen
        .getByRole("heading", { level: 3, name })
        .closest("section");

    if (!section) {
        throw new Error(`Act section not found: ${name}`);
    }

    return within(section);
}

// Scope chapter and note assertions to the intended beat.
function getBeatContent(name: string) {
    const article = screen
        .getByRole("heading", { level: 4, name })
        .closest("article");

    if (!article) {
        throw new Error(`Beat card not found: ${name}`);
    }

    return within(article);
}

describe("StoryStructurePage", () => {
    it("shows built-in summaries and displays each selected template", async () => {
        const { user } = renderStoryStructurePage();

        const picker = screen.getByRole("group", {
            name: "Built-in story structure templates",
        });

        const presets = [
            {
                name: "Three-Act Structure",
                beatCount: 9,
                description:
                    "Divide the story into Setup, Confrontation and Resolution.",
            },
            {
                name: "Hero's Journey",
                beatCount: 12,
                description:
                    "Follow a hero who leaves the ordinary world, faces trials and returns transformed.",
            },
            {
                name: "Save the Cat",
                beatCount: 15,
                description:
                    "Use a three-act framework with 15 story beats.",
            },
        ];

        expect(within(picker).getAllByRole("button")).toHaveLength(3);

        // Keep the page mounted so switches must update selection and content.
        for (const { name, beatCount, description } of presets) {
            const option = within(picker).getByRole("button", {
                name: new RegExp(name),
            });

            expect(option).toHaveTextContent(
                `3 acts · ${beatCount} story beats`
            );

            await user.click(option);

            expect(
                within(picker).getByRole("button", { pressed: true })
            ).toBe(option);

            expect(
                screen.getByRole("heading", { level: 2, name })
            ).toBeInTheDocument();

            expect(screen.getByText(description)).toBeInTheDocument();

            expect(
                screen.getAllByRole("textbox", { name: "ACT NOTES" })
            ).toHaveLength(3);

            expect(
                screen.getAllByRole("heading", { level: 4 })
            ).toHaveLength(beatCount);
        }
    });

    it.each([
        {
            templateId: "three-act",
            actName: "Setup",
            beatName: "Plot Point One",
            chapterAt44: 11,
            chapterAt88: 22,
        },
        {
            templateId: "heros-journey",
            actName: "Act One",
            beatName: "Crossing the First Threshold",
            chapterAt44: 11,
            chapterAt88: 22,
        },
        {
            templateId: "save-the-cat",
            actName: "Act One",
            beatName: "Break Into Two",
            chapterAt44: 10,
            chapterAt88: 20,
        },
    ])(
        "automatically recalculates $templateId when planning settings change",
        async ({
            templateId,
            actName,
            beatName,
            chapterAt44,
            chapterAt88,
        }) => {
            const { user, getProject } = renderStoryStructurePage({
                ...TEST_PROJECT,
                storyStructure: templateId,
            });

            const targetInput = screen.getByRole("spinbutton", {
                name: "TARGET WORDS",
            });
            const averageInput = screen.getByRole("spinbutton", {
                name: "AVG. CHAPTER",
            });

            expect(screen.getByText("20 chapters")).toBeInTheDocument();

            // Changing target words must update both act and beat mappings.
            await user.clear(targetInput);
            await user.type(targetInput, "132000");

            expect(screen.getByText("44 chapters")).toBeInTheDocument();

            expect(
                getActContent(actName).getByText(
                    `Chapters 1–${chapterAt44}`
                )
            ).toBeInTheDocument();

            expect(
                getBeatContent(beatName).getByText(
                    `Chapter ${chapterAt44}`
                )
            ).toBeInTheDocument();

            await user.clear(averageInput);
            await user.type(averageInput, "1500");

            expect(screen.getByText("88 chapters")).toBeInTheDocument();

            expect(
                getActContent(actName).getByText(
                    `Chapters 1–${chapterAt88}`
                )
            ).toBeInTheDocument();

            expect(
                getBeatContent(beatName).getByText(
                    `Chapter ${chapterAt88}`
                )
            ).toBeInTheDocument();

            expect(getProject()).toMatchObject({
                targetWordCount: 132000,
                averageChapterLength: 1500,
                storyStructure: templateId,
            });

            expect(getProject().chapters).toEqual(TEST_PROJECT.chapters);
        }
    );

    it.each([
        { fieldLabel: "TARGET WORDS", validValue: "60000" },
        { fieldLabel: "AVG. CHAPTER", validValue: "3000" },
    ])(
        "rejects invalid $fieldLabel values and restores the valid plan",
        ({ fieldLabel, validValue }) => {
            const { getProject } = renderStoryStructurePage();

            const input = screen.getByRole("spinbutton", {
                name: fieldLabel,
            });

            const validationMessage = "Enter whole numbers greater than 0.";

            // Set complete values so controlled inputs receive negatives and decimals intact.
            for (const value of ["", "0", "-1", "3000.5"]) {
                fireEvent.change(input, { target: { value } });

                expect(
                    screen.getByText(validationMessage)
                ).toBeInTheDocument();

                expect(screen.getByText("—")).toBeInTheDocument();

                expect(
                    screen.queryByText("20 chapters")
                ).not.toBeInTheDocument();

                expect(
                    screen
                        .getByRole("heading", { level: 3, name: "Setup" })
                        .closest("header")
                ).toHaveTextContent("Not mapped");

                expect(
                    getBeatContent("Plot Point One").getByText("Not mapped")
                ).toBeInTheDocument();

                expect(
                    screen.queryAllByText(/^Chapters? \d/)
                ).toHaveLength(0);

                // A valid replacement restores the plan without a separate action.
                fireEvent.change(input, {
                    target: { value: validValue },
                });

                expect(
                    screen.queryByText(validationMessage)
                ).not.toBeInTheDocument();

                expect(
                    screen.getByText("20 chapters")
                ).toBeInTheDocument();

                expect(
                    getActContent("Setup").getByText("Chapters 1–5")
                ).toBeInTheDocument();

                expect(
                    getBeatContent("Plot Point One").getByText("Chapter 5")
                ).toBeInTheDocument();
            }

            expect(getProject()).toMatchObject({
                targetWordCount: 60000,
                averageChapterLength: 3000,
            });
        }
    );

    it("edits and clears notes while preserving unchanged notes", async () => {
        const { user, getProject } = renderStoryStructurePage({
            ...TEST_PROJECT,
            storyStructureNotes: {
                "three-act": {
                    actNotes: {
                        "ta-act1": "Original act note",
                        "ta-act2": "Keep act note",
                    },
                    beatNotes: {
                        "ta-exposition": "Original beat note",
                        "ta-plot-point1": "Keep beat note",
                    },
                },
            },
        });

        const actInput = getActContent("Setup").getByRole("textbox", {
            name: "ACT NOTES",
        });
        const beatInput = getBeatContent("Exposition").getByRole("textbox", {
            name: "NOTES",
        });

        const actText = "Updated act note\nfirst line";
        const beatText = "Updated beat note\nsecond line";

        fireEvent.change(actInput, { target: { value: actText } });
        fireEvent.change(beatInput, { target: { value: beatText } });

        expect(actInput).toHaveValue(actText);
        expect(beatInput).toHaveValue(beatText);

        fireEvent.change(actInput, { target: { value: "" } });
        fireEvent.change(beatInput, { target: { value: "" } });

        // Reopen the template to verify intentional clearing is retained.
        await user.click(
            screen.getByRole("button", { name: /Hero's Journey/ })
        );
        await user.click(
            screen.getByRole("button", { name: /Three-Act Structure/ })
        );

        expect(
            getActContent("Setup").getByRole("textbox", {
                name: "ACT NOTES",
            })
        ).toHaveValue("");

        expect(
            getBeatContent("Exposition").getByRole("textbox", {
                name: "NOTES",
            })
        ).toHaveValue("");

        expect(
            getActContent("Confrontation").getByRole("textbox", {
                name: "ACT NOTES",
            })
        ).toHaveValue("Keep act note");

        expect(
            getBeatContent("Plot Point One").getByRole("textbox", {
                name: "NOTES",
            })
        ).toHaveValue("Keep beat note");

        expect(getProject()).toEqual({
            ...TEST_PROJECT,
            storyStructureNotes: {
                "three-act": {
                    actNotes: {
                        "ta-act1": "",
                        "ta-act2": "Keep act note",
                    },
                    beatNotes: {
                        "ta-exposition": "",
                        "ta-plot-point1": "Keep beat note",
                    },
                },
            },
        });
    });

    it("keeps each template's notes when switching templates and recalculating", async () => {
        const { user, getProject } = renderStoryStructurePage();

        const presets = [
            {
                name: "Three-Act Structure",
                actName: "Setup",
                beatName: "Exposition",
                actNote: "Three-Act act note",
                beatNote: "Three-Act beat note",
            },
            {
                name: "Hero's Journey",
                actName: "Act One",
                beatName: "The Ordinary World",
                actNote: "Hero act note",
                beatNote: "Hero beat note",
            },
            {
                name: "Save the Cat",
                actName: "Act One",
                beatName: "Opening Image",
                actNote: "Cat act note",
                beatNote: "Cat beat note",
            },
        ];

        for (const preset of presets) {
            await user.click(
                screen.getByRole("button", {
                    name: new RegExp(preset.name),
                })
            );

            fireEvent.change(
                getActContent(preset.actName).getByRole("textbox", {
                    name: "ACT NOTES",
                }),
                { target: { value: preset.actNote } }
            );

            fireEvent.change(
                getBeatContent(preset.beatName).getByRole("textbox", {
                    name: "NOTES",
                }),
                { target: { value: preset.beatNote } }
            );
        }

        // Recalculating the plan must preserve notes already entered.
        fireEvent.change(
            screen.getByRole("spinbutton", { name: "TARGET WORDS" }),
            { target: { value: "132000" } }
        );

        expect(screen.getByText("44 chapters")).toBeInTheDocument();

        for (const preset of presets) {
            await user.click(
                screen.getByRole("button", {
                    name: new RegExp(preset.name),
                })
            );

            expect(
                getActContent(preset.actName).getByRole("textbox", {
                    name: "ACT NOTES",
                })
            ).toHaveValue(preset.actNote);

            expect(
                getBeatContent(preset.beatName).getByRole("textbox", {
                    name: "NOTES",
                })
            ).toHaveValue(preset.beatNote);
        }

        expect(getProject().storyStructureNotes).toEqual({
            "three-act": {
                actNotes: { "ta-act1": "Three-Act act note" },
                beatNotes: { "ta-exposition": "Three-Act beat note" },
            },
            "heros-journey": {
                actNotes: { "hj-act1": "Hero act note" },
                beatNotes: { "hj-ordinary-world": "Hero beat note" },
            },
            "save-the-cat": {
                actNotes: { "sat-act1": "Cat act note" },
                beatNotes: { "sat-opening-image": "Cat beat note" },
            },
        });
    });

});