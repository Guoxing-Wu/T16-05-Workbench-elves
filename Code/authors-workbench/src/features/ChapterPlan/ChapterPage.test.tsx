import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createProject, makeChapter, makeCharacter, makeLocation, makeStoryEvent, makeStoryScene } from "../../lib/domain";
import type { Chapter, StoryEvent, StoryScene, WritingProject } from "../../lib/domain";
import { useWorkbench } from "../../lib/store";
import { ChapterPage } from "./ChapterPage";

// The page is tested on its own, so the store is replaced with a mock that records calls.
jest.mock("../../lib/store", () => ({
  useWorkbench: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const addChapterMock = jest.fn<(projectId: string) => void>();
const updateChapterMock = jest.fn<(projectId: string, chapterId: string, patch: Partial<Chapter>, silent?: boolean) => void>();
const updateProjectMock = jest.fn<(id: string, updater: (project: WritingProject) => WritingProject) => void>();
const updateStoryEventMock = jest.fn<(projectId: string, eventId: string, patch: Partial<StoryEvent>, silent?: boolean) => void>();
const updateStorySceneMock = jest.fn<(projectId: string, sceneId: string, patch: Partial<StoryScene>, silent?: boolean) => void>();

// The editor panel destructures more store fields, so they are stubbed too.
function mockStore() {
  storeMock.mockReturnValue({
    addChapter: addChapterMock,
    updateChapter: updateChapterMock,
    updateProject: updateProjectMock,
    updateStoryEvent: updateStoryEventMock,
    updateStoryScene: updateStorySceneMock,
    addCharacter: jest.fn(),
    addLocation: jest.fn(),
    addStoryEvent: jest.fn(),
    addStoryScene: jest.fn(),
    removeChapter: jest.fn(),
    customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);
}

function renderPage(project: WritingProject) {
  mockStore();
  return render(<ChapterPage project={project} />);
}

function baseProject(): WritingProject {
  return createProject({
    title: "Story",
    targetWordCount: 0,
    averageChapterLength: 0,
    storyStructure: "three-act",
  });
}

// A three-act project with three chapters and a full set of linked entities.
function populatedProject() {
  const project = baseProject();
  const ch1 = makeChapter(0, 1);
  ch1.title = "Opening";
  ch1.characterIds = ["p1", "p2"];
  const ch2 = makeChapter(1, 2);
  ch2.title = "Rising";
  ch2.targetWordCount = 5000;
  const ch3 = makeChapter(2, 3);
  ch3.title = "Climax";
  ch3.notes = "A twist";

  const ava = makeCharacter({ firstName: "Ava", birthday: { year: 1990 }, role: ["Protagonist"] });
  ava.id = "p1";
  const ben = makeCharacter({ firstName: "Ben", birthday: { year: 1990 } });
  ben.id = "p2";
  const carlton = makeLocation({ name: "Carlton" });
  const event = makeStoryEvent({
    title: "Arrival",
    chapterIds: [ch1.id],
    characterIds: ["p1"],
    startDate: { year: 1990 },
    endDate: { year: 0 },
    locationId: carlton.id,
    isStoryBeat: false,
  });
  const scene = makeStoryScene({
    title: "Lobby",
    date: { year: 1990 },
    chapterIds: [ch1.id],
    characterIds: ["p2"],
    locationId: carlton.id,
  });

  project.chapters = [ch1, ch2, ch3];
  project.characters = [ava, ben];
  project.locations = [carlton];
  project.events = [event];
  project.scenes = [scene];
  return { project, ch1, ch2, ch3, event, scene, carlton };
}

// A minimal fake DataTransfer for drag events.
function makeDataTransfer(types: string[]) {
  return { types, setData: jest.fn(), getData: jest.fn(), effectAllowed: "" };
}

beforeEach(() => {
  addChapterMock.mockClear();
  updateChapterMock.mockClear();
  updateProjectMock.mockClear();
  updateStoryEventMock.mockClear();
  updateStorySceneMock.mockClear();
});

describe("ChapterPage — header and empty state", () => {
  it("shows the count and an empty state when there are no chapters", () => {
    renderPage(baseProject());

    expect(screen.getByText(/0 projected chapters/)).toBeInTheDocument();
    expect(screen.getByText("No chapters yet. Add a chapter to start planning.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add chapter" })).toBeInTheDocument();
  });

  it("adds a chapter when the Add chapter button is clicked", async () => {
    const user = userEvent.setup();
    const { project } = populatedProject();
    renderPage(project);

    await user.click(screen.getByRole("button", { name: "Add chapter" }));
    expect(addChapterMock).toHaveBeenCalledWith(project.id);
  });
});

describe("ChapterPage — grid view", () => {
  it("renders the act band and a card per chapter with its linked entities", () => {
    renderPage(populatedProject().project);

    // Header count uses the story structure name.
    expect(screen.getByText(/3 projected chapters/)).toBeInTheDocument();

    // Act band segments.
    expect(screen.getByText("Act I")).toBeInTheDocument();
    expect(screen.getByText("Act II")).toBeInTheDocument();
    expect(screen.getByText("Act III")).toBeInTheDocument();

    // One card per chapter.
    const opening = screen.getByRole("button", { name: /Opening/ });
    expect(opening).toHaveTextContent("CH. 1");
    expect(screen.getByRole("button", { name: /Rising/ })).toHaveTextContent("5,000 words");
    expect(screen.getByRole("button", { name: /Climax/ })).toHaveTextContent("A twist");

    // Linked characters, locations, events and scenes render as tags on the card.
    const openingScope = within(opening);
    expect(openingScope.getByText("AV")).toBeInTheDocument();
    expect(openingScope.getByText("BE")).toBeInTheDocument();
    expect(openingScope.getByText("Carlton")).toBeInTheDocument();
    expect(openingScope.getByText("Arrival")).toBeInTheDocument();
    expect(openingScope.getByText("Lobby")).toBeInTheDocument();
  });

  it("shows the +N badge when a card has more than three characters", () => {
    const { project, ch1 } = populatedProject();
    const extras = ["c3", "c4"].map((id, i) => {
      const c = makeCharacter({ firstName: `Extra${i + 1}`, birthday: { year: 1990 } });
      c.id = id;
      return c;
    });
    project.characters = [...project.characters, ...extras];
    ch1.characterIds = ["p1", "p2", "c3", "c4"];
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    expect(within(opening).getByText("+1")).toBeInTheDocument();
  });

  it("selects a chapter on click, edits its title, then closes the editor", async () => {
    const user = userEvent.setup();
    const { project, ch1 } = populatedProject();
    renderPage(project);

    expect(screen.queryByText("Chapter title")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Opening/ }));

    // Editor panel appears.
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter title")).toBeInTheDocument();

    // Editing the title fires the change callback for the selected chapter. (The
    // store is mocked, so the controlled input snaps back to the original title
    // after each keystroke — what matters is that the patch was sent.)
    const titleInput = screen.getByLabelText("Chapter title");
    await user.clear(titleInput);
    await user.type(titleInput, "Renamed");
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch1.id, expect.any(Object));

    // Close it.
    await user.click(screen.getByTitle("Close"));
    expect(screen.queryByText("Chapter title")).not.toBeInTheDocument();
  });
});

describe("ChapterPage — list view", () => {
  it("switches to the list view and back to grid", async () => {
    const user = userEvent.setup();
    renderPage(populatedProject().project);

    await user.click(screen.getByRole("button", { name: "List view" }));
    // Rows show number, title and word target.
    expect(screen.getByRole("button", { name: /Opening/ })).toHaveTextContent("CHAPTER 1");
    expect(screen.getByRole("button", { name: /Rising/ })).toHaveTextContent("5,000 words");
    expect(screen.getByRole("button", { name: /Climax/ })).toHaveTextContent("no target");
    // The grid cards are replaced by rows (the act band stays visible).
    expect(screen.queryByText("CH. 1")).not.toBeInTheDocument();

    // Clicking a row selects the chapter and opens the editor.
    await user.click(screen.getByRole("button", { name: /Opening/ }));
    expect(screen.getByText("Chapter title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByText("CH. 1")).toBeInTheDocument();
  });
});

describe("ChapterPage — chapter reordering by drag and drop", () => {
  it("reorders a chapter dropped after another", () => {
    const { project, ch1, ch2, ch3 } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const climax = screen.getByRole("button", { name: /Climax/ });

    fireEvent.dragStart(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });
    // Dropping after the third card (clientX beyond its zero-width centre).
    fireEvent.dragOver(climax, { dataTransfer: makeDataTransfer(["text/plain"]), clientX: 10 });
    fireEvent.drop(climax, { dataTransfer: makeDataTransfer(["text/plain"]) });

    expect(updateProjectMock).toHaveBeenCalledTimes(1);
    const updater = updateProjectMock.mock.calls[0][1];
    const result = updater(project);
    expect(result.chapters.map((c) => c.id)).toEqual([ch2.id, ch3.id, ch1.id]);
    expect(result.chapters.map((c) => c.order)).toEqual([0, 1, 2]);
  });

  it("does not reorder when the chapter is dropped in its own slot", () => {
    const { project } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });

    // Dropping the second chapter "after" the first card lands in its own slot
    // (insert index 1 equals the source index 1), so nothing is reordered.
    fireEvent.dragStart(rising, { dataTransfer: makeDataTransfer(["text/plain"]) });
    fireEvent.dragOver(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });
    fireEvent.drop(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });

    expect(updateProjectMock).not.toHaveBeenCalled();
  });

  it("resets drag state on dragEnd so a following click still selects", () => {
    const { project } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    fireEvent.dragStart(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });
    fireEvent.dragEnd(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });

    // dragEnd clears the drag state, so the click is treated as a selection.
    fireEvent.click(opening);
    expect(screen.getByText("Chapter title")).toBeInTheDocument();
  });

  it("suppresses the click that immediately follows a drag start", () => {
    const { project } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    fireEvent.dragStart(opening, { dataTransfer: makeDataTransfer(["text/plain"]) });

    // Without a dragEnd, the very next click is suppressed so nothing is selected.
    fireEvent.click(opening);
    expect(screen.queryByText("Chapter title")).not.toBeInTheDocument();
  });

  it("ignores a drag over the same card", () => {
    const { project } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const dt = makeDataTransfer(["text/plain"]);
    fireEvent.dragStart(opening, { dataTransfer: dt });
    // Hovering back over the dragged card does not set an insertion index.
    fireEvent.dragOver(opening, { dataTransfer: dt });
    fireEvent.drop(opening, { dataTransfer: dt });

    expect(updateProjectMock).not.toHaveBeenCalled();
  });
});

describe("ChapterPage — moving entities between chapters", () => {
  it("moves a character from its source chapter to the target chapter", () => {
    const { project, ch1, ch2 } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });
    const avaTag = within(opening).getByText("AV");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(avaTag, { dataTransfer: dt });
    fireEvent.dragOver(rising, { dataTransfer: dt });
    fireEvent.drop(rising, { dataTransfer: dt });

    // Ava is removed from chapter one and added to chapter two.
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch1.id, { characterIds: ["p2"] }, true);
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch2.id, { characterIds: ["p1"] });
  });

  it("moves a location from its source chapter to the target chapter", () => {
    const { project, ch1, ch2, carlton } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });
    const locTag = within(opening).getByText("Carlton");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(locTag, { dataTransfer: dt });
    fireEvent.dragOver(rising, { dataTransfer: dt });
    fireEvent.drop(rising, { dataTransfer: dt });

    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch1.id, { locationIds: [] }, true);
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch2.id, { locationIds: [carlton.id] });
  });

  it("moves an event from its source chapter to the target chapter", () => {
    const { project, ch2, event } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });
    const evtTag = within(opening).getByText("Arrival");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(evtTag, { dataTransfer: dt });
    fireEvent.dragOver(rising, { dataTransfer: dt });
    fireEvent.drop(rising, { dataTransfer: dt });

    expect(updateStoryEventMock).toHaveBeenCalledWith(project.id, event.id, { chapterIds: [ch2.id] }, true);
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch2.id, {});
  });

  it("moves a scene from its source chapter to the target chapter", () => {
    const { project, ch2, scene } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });
    const sceneTag = within(opening).getByText("Lobby");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(sceneTag, { dataTransfer: dt });
    fireEvent.dragOver(rising, { dataTransfer: dt });
    fireEvent.drop(rising, { dataTransfer: dt });

    expect(updateStorySceneMock).toHaveBeenCalledWith(project.id, scene.id, { chapterIds: [ch2.id] }, true);
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch2.id, {});
  });

  it("does not move an entity dropped back onto its own chapter", () => {
    const { project, ch1 } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const avaTag = within(opening).getByText("AV");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(avaTag, { dataTransfer: dt });
    fireEvent.dragOver(opening, { dataTransfer: dt });
    fireEvent.drop(opening, { dataTransfer: dt });

    // Dropping on the source chapter is a no-op: no move call at all.
    expect(updateChapterMock).not.toHaveBeenCalledWith(project.id, ch1.id, expect.anything(), true);
    expect(updateStoryEventMock).not.toHaveBeenCalled();
    expect(updateStorySceneMock).not.toHaveBeenCalled();
  });

  it("moves a character to a chapter that already has characters", () => {
    const { project, ch1, ch2 } = populatedProject();
    // Rising already lists Ben; Ava should be appended after him, not override.
    ch2.characterIds = ["p2"];
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const rising = screen.getByRole("button", { name: /Rising/ });
    const avaTag = within(opening).getByText("AV");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(avaTag, { dataTransfer: dt });
    fireEvent.dragOver(rising, { dataTransfer: dt });
    fireEvent.drop(rising, { dataTransfer: dt });

    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch1.id, { characterIds: ["p2"] }, true);
    expect(updateChapterMock).toHaveBeenCalledWith(project.id, ch2.id, { characterIds: ["p2", "p1"] });
  });

  it("clears the entity drag state when an entity tag drag ends", () => {
    const { project } = populatedProject();
    renderPage(project);

    const opening = screen.getByRole("button", { name: /Opening/ });
    const avaTag = within(opening).getByText("AV");
    const dt = makeDataTransfer(["application/x-entity"]);

    fireEvent.dragStart(avaTag, { dataTransfer: dt });
    fireEvent.dragEnd(avaTag, { dataTransfer: dt });
    // The entity drag was cancelled, so a drop afterwards moves nothing.
    fireEvent.drop(opening, { dataTransfer: dt });

    expect(updateChapterMock).not.toHaveBeenCalled();
    expect(updateStoryEventMock).not.toHaveBeenCalled();
    expect(updateStorySceneMock).not.toHaveBeenCalled();
  });
});
