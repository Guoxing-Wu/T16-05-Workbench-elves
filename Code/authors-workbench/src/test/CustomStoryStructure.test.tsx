import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CustomStructureManager } from "../features/story-structure/CustomStructureManager";
import type { StoryStructureTemplate } from "../features/story-structure/storyStructureTemplate";
import { useWorkbench } from "../lib/store";

jest.mock("../lib/store", () => ({
    useWorkbench: jest.fn(),
}));

const mockAddCustomStoryStructure = jest.fn();
const mockUpdateCustomStoryStructure = jest.fn();
const mockDeleteCustomStoryStructure = jest.fn();

const mockStructure: StoryStructureTemplate = {
    id: "custom-1",
    name: "My Mystery Structure",
    description: "A structure for mystery stories.",
    isCustom: true,
    acts: [
        {
            id: "act-1",
            name: "Act 1",
            startPercent: 0,
            endPercent: 100,
        },
    ],
    storyBeats: [
        {
            id: "beat-1",
            name: "The Discovery",
            startPercent: 20,
            endPercent: 20,
            actId: "act-1",
        },
    ],
};

const mockUseWorkbench = useWorkbench as jest.Mock;

function renderManager(
    structures: StoryStructureTemplate[] = [mockStructure],
    props: {
        compact?: boolean;
        selectedStructureId?: string;
        onSelect?: (id: string) => void;
    } = {},
) {
    return render(
        <CustomStructureManager
            structures={structures}
            {...props}
        />,
    );
}

beforeEach(() => {
    jest.clearAllMocks();

    mockUseWorkbench.mockReturnValue({
        addCustomStoryStructure: mockAddCustomStoryStructure,
        updateCustomStoryStructure: mockUpdateCustomStoryStructure,
        deleteCustomStoryStructure: mockDeleteCustomStoryStructure,
    });

    jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("CustomStructureManager", () => {
    test("displays existing custom structures and their details", () => {
        renderManager();

        expect(
            screen.getByRole("heading", {
                name: "Your Story Structures",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "My Mystery Structure",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText("A structure for mystery stories."),
        ).toBeInTheDocument();

        expect(
            screen.getByText("act").parentElement
        ).toHaveTextContent("1 act");

        expect(
            screen.getByText("beat").parentElement
        ).toHaveTextContent("1 beat");
    });

    test("displays an empty state when there are no custom structures", () => {
        renderManager([]);

        expect(
            screen.getByRole("heading", {
                name: "No custom structures yet",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Create Your First Structure",
            }),
        ).toBeInTheDocument();
    });

    test("opens the editor when creating a structure", () => {
        renderManager([]);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Create Your First Structure",
            }),
        );

        expect(
            screen.getByRole("heading", {
                name: "Create Custom Structure",
            }),
        ).toBeInTheDocument();
    });

    test("creates a new structure and calls addCustomStoryStructure when saved", () => {
        renderManager([]);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Create Your First Structure",
            }),
        );

        fireEvent.change(
            screen.getByPlaceholderText("e.g. My Mystery Structure"),
            {
                target: { value: "My New Structure" },
            },
        );

        fireEvent.click(
            screen.getByRole("button", { name: "+ Add Act" }),
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Create Structure" }),
        );

        expect(mockAddCustomStoryStructure).toHaveBeenCalledTimes(1);

        expect(mockAddCustomStoryStructure).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "My New Structure",
                description: "",
                isCustom: true,
                acts: [
                    expect.objectContaining({
                        name: "Act 1",
                        startPercent: 0,
                        endPercent: 100,
                    }),
                ],
                storyBeats: [],
            }),
        );

        expect(
            screen.getByRole("heading", {
                name: "No custom structures yet",
            }),
        ).toBeInTheDocument();
    });

    test("opens the editor with existing details when editing a structure", () => {
        renderManager();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Edit My Mystery Structure",
            }),
        );

        expect(
            screen.getByRole("heading", {
                name: "Edit Custom Structure",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue("My Mystery Structure"),
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue(
                "A structure for mystery stories.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByDisplayValue("The Discovery"),
        ).toBeInTheDocument();
    });

    test("updates an existing structure when changes are saved", () => {
        renderManager();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Edit My Mystery Structure",
            }),
        );

        fireEvent.change(
            screen.getByPlaceholderText("e.g. My Mystery Structure"),
            {
                target: { value: "Updated Mystery Structure" },
            },
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save Changes" }),
        );

        expect(mockUpdateCustomStoryStructure).toHaveBeenCalledTimes(1);

        expect(mockUpdateCustomStoryStructure).toHaveBeenCalledWith(
            "custom-1",
            expect.any(Function),
        );

        const updateFunction =
            mockUpdateCustomStoryStructure.mock.calls[0][1];

        expect(updateFunction()).toEqual(
            expect.objectContaining({
                id: "custom-1",
                name: "Updated Mystery Structure",
                description: "A structure for mystery stories.",
                isCustom: true,
            }),
        );
    });

    test("closes the editor without saving when cancelled", () => {
        renderManager([]);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Create Your First Structure",
            }),
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Cancel" }),
        );

        expect(
            screen.queryByRole("heading", {
                name: "Create Custom Structure",
            }),
        ).not.toBeInTheDocument();

        expect(mockAddCustomStoryStructure).not.toHaveBeenCalled();
        expect(mockUpdateCustomStoryStructure).not.toHaveBeenCalled();
    });

    test("deletes a structure when deletion is confirmed", () => {
        renderManager();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Delete My Mystery Structure",
            }),
        );

        expect(window.confirm).toHaveBeenCalledWith(
            'Delete "My Mystery Structure"?',
        );

        expect(mockDeleteCustomStoryStructure).toHaveBeenCalledWith(
            "custom-1",
        );
    });

    test("does not delete a structure when deletion is cancelled", () => {
        jest.spyOn(window, "confirm").mockReturnValue(false);

        renderManager();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Delete My Mystery Structure",
            }),
        );

        expect(mockDeleteCustomStoryStructure).not.toHaveBeenCalled();
    });

    test("calls onSelect when a structure card is clicked", () => {
        const onSelect = jest.fn();

        renderManager([mockStructure], { onSelect });

        fireEvent.click(
            screen.getByRole("heading", {
                name: "My Mystery Structure",
            }),
        );

        expect(onSelect).toHaveBeenCalledWith("custom-1");
    });

    test("marks the selected structure card", () => {
        const { container } = renderManager(
            [mockStructure],
            { selectedStructureId: "custom-1" },
        );

        expect(
            container.querySelector(".custom-structure-card.is-selected"),
        ).toBeInTheDocument();
    });

    test("shows the compact layout and empty state", () => {
        const { container } = renderManager([], { compact: true });

        expect(
            container.querySelector(".custom-structure-manager.compact"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("No custom story structures yet."),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("heading", {
                name: "Your Story Structures",
            }),
        ).not.toBeInTheDocument();
    });
});