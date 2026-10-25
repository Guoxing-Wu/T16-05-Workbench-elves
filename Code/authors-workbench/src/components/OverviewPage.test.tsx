import { beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { render, screen, within, } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createProject, } from "../lib/domain";
import type { WritingProject, } from "../lib/domain";
import { useWorkbench, } from "../lib/store";
import type { WorkbenchView, } from "../lib/store";
import { OverviewPage, } from "./OverviewPage";

// The page is tested on its own, so the store is replaced with a mock that records the calls.
jest.mock("../lib/store", () => ({
    useWorkbench: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const setActiveViewMock = jest.fn<(view: WorkbenchView) => void>();
const updateProjectMock = jest.fn<(id: string, updater: (project: WritingProject) => WritingProject) => void>();

// Creates a three-act project with 5 chapters and a 10,000 word goal.
function makeTestProject(): WritingProject {
    return createProject({
        title: "Test Novel",
        targetWordCount: 10000,
        averageChapterLength: 2000,
        storyStructure: "three-act",
    });
}

// Sets which project is open for the next render. Passing null means no project is open.
function openProject(project: WritingProject | null) {
    storeMock.mockReturnValue({
        activeProject: project,
        setActiveView: setActiveViewMock,
        updateProject: updateProjectMock,
    } as unknown as ReturnType<typeof useWorkbench>);
}

beforeEach(() => {
    setActiveViewMock.mockClear();
    updateProjectMock.mockClear();
});

describe("OverviewPage without an open project", () => {
    // With no open project there is nothing to summarise, so the page explains what to do next.
    it("shows an empty state with a link to the projects page", async () => {
        const user = userEvent.setup();
        openProject(null);
        render(<OverviewPage />);

        expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
        expect(screen.queryByText("CURRENT MANUSCRIPT")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Go to Projects" }));

        expect(setActiveViewMock).toHaveBeenCalledWith("projects");
    });
});

describe("OverviewPage progress", () => {
    // Progress is the words written in all chapters compared with the project's word goal.
    it("shows the words written, the goal and the percentage drafted", () => {
        const project = makeTestProject();
        project.chapters[0].actualWordCount = 1000;
        project.chapters[1].actualWordCount = 1500;
        openProject(project);

        const { container } = render(<OverviewPage />);

        expect(screen.getByRole("heading", { name: "Test Novel" })).toBeInTheDocument();
        expect(screen.getByText("2,500 of 10,000 words")).toBeInTheDocument();
        expect(screen.getByText("25% drafted")).toBeInTheDocument();
        expect(container.querySelector(".progress-track i")).toHaveStyle({ width: "25%" });
    });

    // Writing more than the goal must not make the bar overflow, so the percentage stops at 100.
    it("caps the percentage at 100", () => {
        const project = makeTestProject();
        project.chapters[0].actualWordCount = 12000;
        openProject(project);

        const { container } = render(<OverviewPage />);

        expect(screen.getByText("100% drafted")).toBeInTheDocument();
        expect(container.querySelector(".progress-track i")).toHaveStyle({ width: "100%" });
    });

    // A project with no word goal cannot be divided by, so it shows 0% rather than NaN or Infinity.
    it("shows 0% when the project has no word goal", () => {
        const project = makeTestProject();
        project.targetWordCount = 0;
        project.chapters[0].actualWordCount = 500;
        openProject(project);

        render(<OverviewPage />);

        expect(screen.getByText("500 of 0 words")).toBeInTheDocument();
        expect(screen.getByText("0% drafted")).toBeInTheDocument();
    });
});

describe("OverviewPage statistics", () => {
    // The stat row counts chapters, characters and events and names the story structure in use.
    it("shows the counts and the story structure name", () => {
        const project = makeTestProject();
        project.characters = [{ id: "a", name: "Ava" }, { id: "b", name: "Ben" }] as WritingProject["characters"];
        project.events = [{ id: "e1" }] as WritingProject["events"];
        openProject(project);

        const { container } = render(<OverviewPage />);

        // "Characters" and "Events" also appear as module card titles, so the search is limited to the stat row.
        const stats = within(container.querySelector(".overview-stat-row") as HTMLElement);

        expect(stats.getByText("Chapters").previousElementSibling).toHaveTextContent("5");
        expect(stats.getByText("Characters").previousElementSibling).toHaveTextContent("2");
        expect(stats.getByText("Events").previousElementSibling).toHaveTextContent("1");
        expect(stats.getByText("Structure").previousElementSibling).toHaveTextContent("Three-Act Structure");
    });
});

describe("OverviewPage module cards", () => {
    // Every card opens its own page, so each one is checked with the view it should switch to.
    it.each<[string, WorkbenchView]>([
        ["Story Structure", "storyStructure"],
        ["Chapter Plan", "chapterPlan"],
        ["Characters", "characters"],
        ["Locations", "locations"],
        ["Events", "events"],
        ["Timeline", "timeline"],
    ])("opens the %s page when its card is clicked", async (title, view) => {
        const user = userEvent.setup();
        openProject(makeTestProject());
        render(<OverviewPage />);

        await user.click(screen.getByRole("heading", { name: title }));

        expect(setActiveViewMock).toHaveBeenCalledTimes(1);
        expect(setActiveViewMock).toHaveBeenCalledWith(view);
    });
});

describe("OverviewPage renaming", () => {
    // Double-clicking the title turns it into an input, and Enter saves the new title for this project.
    it("saves a new title when Enter is pressed", async () => {
        const user = userEvent.setup();
        const project = makeTestProject();
        openProject(project);
        render(<OverviewPage />);

        await user.dblClick(screen.getByRole("heading", { name: "Test Novel" }));
        const input = screen.getByDisplayValue("Test Novel");
        await user.clear(input);
        await user.type(input, "  Renamed Novel  {Enter}");

        expect(updateProjectMock).toHaveBeenCalledTimes(1);
        expect(updateProjectMock.mock.calls[0][0]).toBe(project.id);

        // The store calls this function with the current project, and it must return the project with the trimmed title.
        const updater = updateProjectMock.mock.calls[0][1];
        expect(updater(project)).toEqual({ ...project, title: "Renamed Novel" });
        expect(project.title).toBe("Test Novel");
    });

    // Leaving the input by clicking elsewhere also saves the title.
    it("saves a new title when the input loses focus", async () => {
        const user = userEvent.setup();
        openProject(makeTestProject());
        render(<OverviewPage />);

        await user.dblClick(screen.getByRole("heading", { name: "Test Novel" }));
        const input = screen.getByDisplayValue("Test Novel");
        await user.clear(input);
        await user.type(input, "Another Title");
        await user.tab();

        expect(updateProjectMock).toHaveBeenCalledTimes(1);
    });

    // Escape throws the change away and shows the original title again.
    it("cancels the rename when Escape is pressed", async () => {
        const user = userEvent.setup();
        openProject(makeTestProject());
        render(<OverviewPage />);

        await user.dblClick(screen.getByRole("heading", { name: "Test Novel" }));
        await user.type(screen.getByDisplayValue("Test Novel"), "X{Escape}");

        expect(updateProjectMock).not.toHaveBeenCalled();
        expect(screen.getByRole("heading", { name: "Test Novel" })).toBeInTheDocument();
    });

    // A blank title or an unchanged title is not saved, because it would erase the name or do nothing.
    it.each([
        ["blank", "   "],
        ["unchanged", "Test Novel"],
    ])("does not save the title when it is %s", async (_label, text) => {
        const user = userEvent.setup();
        openProject(makeTestProject());
        render(<OverviewPage />);

        await user.dblClick(screen.getByRole("heading", { name: "Test Novel" }));
        const input = screen.getByDisplayValue("Test Novel");
        await user.clear(input);
        await user.type(input, `${text}{Enter}`);

        expect(updateProjectMock).not.toHaveBeenCalled();
    });
});
