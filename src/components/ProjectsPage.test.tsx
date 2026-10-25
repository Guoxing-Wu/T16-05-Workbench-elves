import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createProject } from "../lib/domain";
import type { WritingProject } from "../lib/domain";
import { useWorkbench } from "../lib/store";
import { ProjectsPage } from "./ProjectsPage";

// The page is tested on its own, so the store is replaced with a mock that records the calls.
jest.mock("../lib/store", () => ({
  useWorkbench: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const createProjectMock = jest.fn();
const updateProjectMock = jest.fn<(id: string, updater: (project: WritingProject) => WritingProject) => void>();
const deleteProjectMock = jest.fn();
const onOpenMock = jest.fn<(id: string) => void>();

// Builds a three-act project whose initial chapter count follows the word counts.
function makeProject(title = "Test Novel", target = 10000, avg = 2000): WritingProject {
  return createProject({ title, targetWordCount: target, averageChapterLength: avg, storyStructure: "three-act" });
}

// Sets the store fields for the next render and mounts the page.
function mount(overrides: Partial<ReturnType<typeof useWorkbench>> = {}) {
  storeMock.mockReturnValue({
    projects: [],
    createProject: createProjectMock,
    updateProject: updateProjectMock,
    deleteProject: deleteProjectMock,
    activeProjectId: null,
    customStoryStructures: [],
    ...overrides,
  } as unknown as ReturnType<typeof useWorkbench>);
  return render(<ProjectsPage onOpen={onOpenMock} />);
}

beforeEach(() => {
  createProjectMock.mockClear();
  updateProjectMock.mockClear();
  deleteProjectMock.mockClear();
  onOpenMock.mockClear();
});

describe("ProjectsPage without any projects", () => {
  it("shows an empty state and a header count of zero", () => {
    mount();

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("0 saved projects")).toBeInTheDocument();
    expect(screen.getByText("No projects yet")).toBeInTheDocument();

    // A "New project" button appears both in the header and in the empty state.
    expect(screen.getAllByRole("button", { name: "New project" })).toHaveLength(2);
  });

  it("opens the create modal from the empty state", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[1]);

    expect(screen.getByRole("heading", { name: "Create a writing project" })).toBeInTheDocument();
  });
});

describe("ProjectsPage project cards", () => {
  it("renders a card per project with its stats and marks the active one", () => {
    const p1 = makeProject("Alpha", 10000, 2000); // 5 chapters
    p1.chapters[0].actualWordCount = 1000;
    p1.chapters[1].actualWordCount = 500;
    const p2 = makeProject("Beta", 8000, 1000); // 8 chapters
    p2.targetWordCount = 0; // exercise the "0 goal" display path
    mount({ projects: [p1, p2], activeProjectId: p1.id });

    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByText("2 saved projects")).toBeInTheDocument();

    // Alpha wrote 1,000 + 500 words toward its 10,000 goal.
    expect(screen.getByText("1,500 of 10,000 words written")).toBeInTheDocument();

    const cardA = screen.getByRole("heading", { name: "Alpha" }).closest("article")!;
    expect(cardA).toHaveTextContent("CURRENT PROJECT");
    expect(cardA).toHaveTextContent("10,000 target words");
    expect(cardA).toHaveTextContent("5 chapters");

    const cardB = screen.getByRole("heading", { name: "Beta" }).closest("article")!;
    expect(cardB).not.toHaveTextContent("CURRENT PROJECT");
    expect(cardB).toHaveTextContent("0 target words");
    expect(cardB).toHaveTextContent("8 chapters");
  });

  it("calls onOpen with the project id when Open project is clicked", async () => {
    const user = userEvent.setup();
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: /Open project/ }));

    expect(onOpenMock).toHaveBeenCalledTimes(1);
    expect(onOpenMock).toHaveBeenCalledWith(p1.id);
  });

  it("opens the edit modal prefilled when Edit is clicked", async () => {
    const user = userEvent.setup();
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Edit Test Novel" }));

    expect(screen.getByRole("heading", { name: "Edit writing project" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Novel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2000")).toBeInTheDocument();
  });
});

describe("ProjectsPage deleting a project", () => {
  let confirmSpy: jest.SpiedFunction<typeof window.confirm>;

  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it("deletes the project after the confirmation is accepted", async () => {
    const user = userEvent.setup();
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Delete Test Novel" }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Delete"));
    expect(deleteProjectMock).toHaveBeenCalledTimes(1);
    expect(deleteProjectMock).toHaveBeenCalledWith(p1.id);
  });

  it("does not delete the project when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValue(false);
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Delete Test Novel" }));

    expect(deleteProjectMock).not.toHaveBeenCalled();
  });
});

describe("ProjectsPage creating a project", () => {
  it("estimates the chapter count and only enables submit once both word counts are set", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);

    const expectEstimate = (n: number) =>
      expect(screen.getByText(/Act boundaries and story beats are mapped automatically/)).toHaveTextContent(
        `approximately ${n} chapters`,
      );

    const submit = screen.getByRole("button", { name: "Create project" });
    expect(submit).toBeDisabled();
    expectEstimate(0);

    // Setting only the total word count is not enough to estimate or to submit.
    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "10000" } });
    expectEstimate(0);
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "2000" } });
    expectEstimate(5);
    expect(submit).toBeEnabled();
  });

  it("shows zero chapters again when a word count field is cleared", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);

    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "2000" } });
    const hint = screen.getByText(/Act boundaries and story beats are mapped automatically/);
    expect(hint).toHaveTextContent("approximately 5 chapters");

    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "" } });

    expect(hint).toHaveTextContent("approximately 0 chapters");
  });

  it("does not create anything when the form is submitted without word counts", () => {
    mount();

    fireEvent.click(screen.getAllByRole("button", { name: "New project" })[0]);
    // The submit button is disabled, but a direct submit event must still be a no-op.
    fireEvent.submit(document.querySelector(".workbench-form") as HTMLElement);

    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("creates a project with the trimmed title and word counts on submit", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);

    const title = screen.getByLabelText("Project title");
    await user.clear(title);
    await user.type(title, "  Brand New  ");
    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "2000" } });

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(createProjectMock).toHaveBeenCalledTimes(1);
    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Brand New",
        targetWordCount: 10000,
        averageChapterLength: 2000,
        storyStructure: "three-act",
      }),
    );
    expect(screen.queryByRole("heading", { name: "Create a writing project" })).not.toBeInTheDocument();
  });

  it("submits the selected story structure", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);
    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "2000" } });
    await user.selectOptions(screen.getByLabelText("Story structure"), "heros-journey");

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ storyStructure: "heros-journey" }),
    );
  });

  it("does not create a project when the modal is cancelled", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Create a writing project" })).not.toBeInTheDocument();
  });

  it("lists a custom story structure when the user has custom structures", async () => {
    const user = userEvent.setup();
    mount({
      customStoryStructures: [{ id: "custom-1", name: "My Custom" }] as unknown as ReturnType<
        typeof useWorkbench
      >["customStoryStructures"],
    });

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);

    expect(screen.getByRole("option", { name: "My Custom" })).toBeInTheDocument();
  });
});

describe("ProjectsPage editing a project", () => {
  it("saves the edited word counts by patching the project", async () => {
    const user = userEvent.setup();
    const p1 = makeProject("Test Novel", 10000, 2000);
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Edit Test Novel" }));

    fireEvent.change(screen.getByLabelText("Target word count"), { target: { value: "12000" } });
    fireEvent.change(screen.getByLabelText("Average chapter length"), { target: { value: "3000" } });

    // The estimate reflects the edited values.
    expect(screen.getByText(/Act boundaries and story beats are mapped automatically/)).toHaveTextContent(
      "approximately 4 chapters",
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProjectMock).toHaveBeenCalledTimes(1);
    expect(updateProjectMock.mock.calls[0][0]).toBe(p1.id);
    // Only check that the word counts are patched; the store decides what else (e.g. regenerated
    // chapters) follows, so the patch shape is not locked down.
    const updater = updateProjectMock.mock.calls[0][1];
    expect(updater(p1)).toEqual(
      expect.objectContaining({ targetWordCount: 12000, averageChapterLength: 3000 }),
    );
    expect(screen.queryByRole("heading", { name: "Edit writing project" })).not.toBeInTheDocument();
  });

  it("does not call updateProject when an edit is cancelled", async () => {
    const user = userEvent.setup();
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Edit Test Novel" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateProjectMock).not.toHaveBeenCalled();
  });

  it("closes the edit modal when the header close button is clicked", async () => {
    const user = userEvent.setup();
    const p1 = makeProject();
    mount({ projects: [p1] });

    await user.click(screen.getByRole("button", { name: "Edit Test Novel" }));

    const modal = screen.getByRole("heading", { name: "Edit writing project" }).closest(".workbench-modal")!;
    await user.click(modal.querySelector("header button") as HTMLElement);

    expect(updateProjectMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Edit writing project" })).not.toBeInTheDocument();
  });
});
