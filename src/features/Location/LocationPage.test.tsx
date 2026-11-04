import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createProject,
  makeCharacter,
  makeChapter,
  makeLocation,
  makeStoryEvent,
  makeStoryScene,
} from "../../lib/domain";
import type { Location, WritingProject } from "../../lib/domain";
import { useWorkbench } from "../../lib/store";
import { LocationsPage } from "./LocationPage";

// The page is tested on its own, so the store is replaced with a mock that records the calls.
jest.mock("../../lib/store", () => ({
  useWorkbench: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const addLocationMock = jest.fn<
  (projectId: string, input: { name: string; description?: string }) => Location
>();
const removeLocationMock = jest.fn<(projectId: string, locationId: string) => void>();
const updateLocationMock = jest.fn<
  (projectId: string, locationId: string, input: { name: string; description?: string }) => void
>();
const confirmSpy = jest.spyOn(window, "confirm");

// A project with no chapters, no places, no people yet.
function baseProject(): WritingProject {
  return createProject({
    title: "Locations Novel",
    targetWordCount: 0,
    averageChapterLength: 0,
    storyStructure: "three-act",
  });
}

// Provides only the location operations the page actually calls.
function setupStore() {
  storeMock.mockReturnValue({
    addLocation: addLocationMock,
    removeLocation: removeLocationMock,
    updateLocation: updateLocationMock,
  } as unknown as ReturnType<typeof useWorkbench>);
}

function renderPage(project: WritingProject) {
  setupStore();
  return render(<LocationsPage project={project} />);
}

// The Modal renders a close (X) button in its header that calls onClose.
function modalCloseButton(title: string): HTMLElement {
  const modal = screen
    .getByRole("heading", { name: title })
    .closest(".workbench-modal") as HTMLElement;
  return modal.querySelector("header button") as HTMLElement;
}

beforeEach(() => {
  addLocationMock.mockClear();
  removeLocationMock.mockClear();
  updateLocationMock.mockClear();
  confirmSpy.mockReset();
});

describe("LocationsPage — header and empty state", () => {
  it("shows a plural count and an empty state when there are no locations", () => {
    renderPage(baseProject());

    expect(screen.getByText("0 locations have been mapped so far")).toBeInTheDocument();
    expect(screen.getByText(/No locations yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New location" })).toBeInTheDocument();
  });

  it("shows a plural count when there is more than one location", () => {
    const project = baseProject();
    project.locations = [makeLocation({ name: "A" }), makeLocation({ name: "B" })];
    renderPage(project);

    expect(screen.getByText("2 locations have been mapped so far")).toBeInTheDocument();
  });
});

describe("LocationsPage — creating a location", () => {
  it("creates a location with a trimmed name and its description", async () => {
    const user = userEvent.setup();
    const project = baseProject();
    renderPage(project);

    await user.click(screen.getByRole("button", { name: "New location" }));
    await user.type(screen.getByPlaceholderText("e.g. Carlton House"), "  Carlton House  ");
    await user.type(
      screen.getByPlaceholderText("What makes this place matter to the story?"),
      "A manor by the lake."
    );
    await user.click(screen.getByRole("button", { name: "Create location" }));

    expect(addLocationMock).toHaveBeenCalledTimes(1);
    expect(addLocationMock.mock.calls[0][0]).toBe(project.id);
    expect(addLocationMock.mock.calls[0][1]).toEqual({
      name: "Carlton House",
      description: "A manor by the lake.",
    });
    // The modal closes after a successful create.
    expect(screen.queryByRole("heading", { name: "Create location" })).not.toBeInTheDocument();
  });

  it("does not create a location when the name is blank", async () => {
    const user = userEvent.setup();
    renderPage(baseProject());

    await user.click(screen.getByRole("button", { name: "New location" }));
    await user.type(screen.getByPlaceholderText("e.g. Carlton House"), "   ");
    await user.click(screen.getByRole("button", { name: "Create location" }));

    expect(addLocationMock).not.toHaveBeenCalled();
    // The modal stays open so the author can fix the name.
    expect(screen.getByRole("heading", { name: "Create location" })).toBeInTheDocument();
  });

  it("cancels creating a location without adding it", async () => {
    const user = userEvent.setup();
    renderPage(baseProject());

    await user.click(screen.getByRole("button", { name: "New location" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(addLocationMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Create location" })).not.toBeInTheDocument();
  });

  it("closes the create modal via its header close button without adding", async () => {
    const user = userEvent.setup();
    renderPage(baseProject());

    await user.click(screen.getByRole("button", { name: "New location" }));
    await user.click(modalCloseButton("Create location"));

    expect(addLocationMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Create location" })).not.toBeInTheDocument();
  });
});

describe("LocationsPage — a location card", () => {
  function singleCardProject() {
    const location = makeLocation({ name: "Carlton House", description: "A manor by the lake." });
    const chapter = makeChapter(0, 1);
    chapter.title = "The Beginning";
    const character = makeCharacter({
      firstName: "Ava",
      birthday: { year: 1990 },
      location: location.name,
    });
    const event = makeStoryEvent({
      chapterIds: [chapter.id],
      title: "Arrival",
      characterIds: [character.id],
      startDate: { year: 1990 },
      endDate: { year: 0 },
      locationId: location.id,
      isStoryBeat: false,
    });
    const project: WritingProject = {
      ...baseProject(),
      chapters: [chapter],
      characters: [character],
      locations: [location],
      events: [event],
      scenes: [],
    };
    return { project, location };
  }

  it("shows the description, singular stats and the people who appear there", () => {
    renderPage(singleCardProject().project);

    const card = screen
      .getByRole("heading", { name: "Carlton House" })
      .closest(".location-card") as HTMLElement;
    const cardScope = within(card);

    expect(screen.getByText("A manor by the lake.")).toBeInTheDocument();
    // Singular wording when exactly one of each is linked. The stats mix a <strong>
    // number with a unit, so the whole stat block is matched by its text content.
    const stats = card.querySelector(".location-stats");
    expect(stats).toHaveTextContent("1 chapter");
    expect(stats).toHaveTextContent("1 event");
    expect(stats).toHaveTextContent("1 character");
    expect(screen.getByText("1 location has been mapped so far")).toBeInTheDocument();
    expect(card.querySelector(".location-people")).toHaveTextContent("Ava");
    expect(cardScope.getByRole("button", { name: "Open location histories" })).toBeInTheDocument();
  });

  it("counts characters from their profile location without event links", () => {
    const { project, location } = singleCardProject();
    project.events[0].characterIds = [];
    renderPage(project);

    const card = screen
      .getByRole("heading", { name: location.name })
      .closest(".location-card") as HTMLElement;
    const stats = card.querySelector(".location-stats");

    expect(stats).toHaveTextContent("1 character");
    expect(card.querySelector(".location-people")).toHaveTextContent("Ava");
  });

  it("does not render a description paragraph when the location has none", () => {
    const project = baseProject();
    project.locations = [makeLocation({ name: "Riverfront" })];
    renderPage(project);

    const card = screen
      .getByRole("heading", { name: "Riverfront" })
      .closest(".location-card") as HTMLElement;
    expect(card.querySelector(".location-description")).toBeNull();
  });
});

describe("LocationsPage — history grouping and date formatting", () => {
  // A single location linked to two chapters, five events and four scenes, so every
  // grouping branch (chapter groups, nested scenes, standalone scenes, no-chapter) runs.
  function richProject(): WritingProject {
    const carlton = makeLocation({ name: "Carlton House", description: "A manor by the lake." });

    const ch1 = makeChapter(0, 1);
    ch1.title = "The Beginning";
    const ch2 = makeChapter(1, 2);
    ch2.title = "The Middle";
    // A chapter can link a location directly, even with no events.
    ch2.locationIds = [carlton.id];

    const ava = makeCharacter({
      firstName: "Ava",
      birthday: { year: 1990 },
      location: carlton.name,
    });
    const ben = makeCharacter({
      firstName: "Ben",
      birthday: { year: 1990 },
      location: carlton.name,
    });

    const eveRange = makeStoryEvent({
      chapterIds: [ch1.id],
      title: "Arrival",
      characterIds: [ava.id, ben.id, "missing-person"],
      startDate: { year: 1990, month: 1, day: 10 },
      endDate: { year: 1990, month: 1, day: 20 },
      locationId: carlton.id,
      isStoryBeat: false,
    });
    // References a chapter that is not in the project, which the grouping must drop.
    const eveDayDiff = makeStoryEvent({
      chapterIds: [ch1.id, "missing-chapter"],
      title: "Departure",
      startDate: { year: 1990, month: 1, day: 5 },
      endDate: { year: 1990 },
      locationId: carlton.id,
      isStoryBeat: false,
    });
    const eveMonthDiff = makeStoryEvent({
      chapterIds: [ch2.id],
      title: "Meeting",
      startDate: { year: 1990, month: 2 },
      endDate: { year: 1990, month: 2, day: 1 },
      locationId: carlton.id,
      isStoryBeat: false,
    });
    const eveMonthOnly = makeStoryEvent({
      chapterIds: [ch2.id],
      title: "River Crossing",
      characterIds: [ava.id],
      startDate: { year: 1991, month: 6 },
      endDate: { year: 1991, month: 7 },
      locationId: carlton.id,
      isStoryBeat: false,
    });
    const eveYearOnly = makeStoryEvent({
      chapterIds: [],
      title: "Ancestral Deal",
      characterIds: [],
      startDate: { year: 1888 },
      endDate: { year: 0 },
      locationId: carlton.id,
      isStoryBeat: false,
    });

    const sceneNested = makeStoryScene({
      title: "Arrival Hall",
      date: { year: 1990, month: 1, day: 12 },
      time: "morning",
      eventId: eveRange.id,
      chapterIds: [ch1.id],
      characterIds: [ava.id],
      locationId: carlton.id,
    });
    const sceneNested2 = makeStoryScene({
      title: "Lobby",
      date: { year: 1990, month: 1, day: 11 },
      eventId: eveRange.id,
      chapterIds: [ch1.id],
      locationId: carlton.id,
    });
    const sceneStandalone = makeStoryScene({
      title: "Garden Walk",
      date: { year: 1990, month: 3 },
      chapterIds: [ch1.id],
      locationId: carlton.id,
    });
    const sceneUnassigned = makeStoryScene({
      title: "Secret Cellar",
      date: { year: 1890 },
      chapterIds: [],
      locationId: carlton.id,
    });

    const project: WritingProject = {
      ...baseProject(),
      chapters: [ch1, ch2],
      characters: [ava, ben],
      locations: [carlton],
      events: [eveRange, eveDayDiff, eveMonthDiff, eveMonthOnly, eveYearOnly],
      scenes: [sceneNested, sceneNested2, sceneStandalone, sceneUnassigned],
    };
    return project;
  }

  it("shows an empty history when nothing is linked to the location", async () => {
    const user = userEvent.setup();
    const project = baseProject();
    project.locations = [makeLocation({ name: "Empty Manor" })];
    renderPage(project);

    await user.click(screen.getByRole("button", { name: "Open location histories" }));

    expect(screen.getByText("No related events yet.")).toBeInTheDocument();
  });

  it("groups the history by chapter with nested scenes, standalone scenes and the no-chapter group", async () => {
    const user = userEvent.setup();
    renderPage(richProject());

    const card = screen
      .getByRole("heading", { name: "Carlton House" })
      .closest(".location-card") as HTMLElement;

    // Plural stats for this location.
    const stats = card.querySelector(".location-stats");
    expect(stats).toHaveTextContent("2 chapters");
    expect(stats).toHaveTextContent("9 events");
    expect(stats).toHaveTextContent("2 characters");
    expect(card.querySelector(".location-people")).toHaveTextContent("Ava, Ben");

    // The history is collapsed by default and expands when the link is clicked.
    expect(screen.queryByText("Arrival")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open location histories" }));

    // Chapter groups, in story order.
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("The Beginning")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
    expect(screen.getByText("The Middle")).toBeInTheDocument();

    // Every event is rendered in its chapter group.
    expect(screen.getByText("Arrival")).toBeInTheDocument();
    expect(screen.getByText("Departure")).toBeInTheDocument();
    expect(screen.getByText("Meeting")).toBeInTheDocument();
    expect(screen.getByText("River Crossing")).toBeInTheDocument();

    // Events/scenes without any chapter land in the trailing "No chapter" group.
    expect(screen.getByText("Ancestral Deal")).toBeInTheDocument();
    expect(screen.getByText("Secret Cellar")).toBeInTheDocument();
    expect(screen.getByText("No chapter")).toBeInTheDocument();

    // Nested scenes appear under their event; standalone scenes on their own.
    expect(screen.getByText("Arrival Hall")).toBeInTheDocument();
    expect(screen.getByText("Lobby")).toBeInTheDocument();
    expect(screen.getByText("Garden Walk")).toBeInTheDocument();

    // Date formatting: full date, range, month-only, year-only, and scene time.
    expect(screen.getByText("10 Jan 1990 – 20 Jan 1990")).toBeInTheDocument();
    expect(screen.getByText("5 Jan 1990 – 1990")).toBeInTheDocument();
    expect(screen.getByText("Feb 1990 – 1 Feb 1990")).toBeInTheDocument();
    expect(screen.getByText("Jun 1991 – Jul 1991")).toBeInTheDocument();
    expect(screen.getByText("1888")).toBeInTheDocument();
    expect(screen.getByText("12 Jan 1990 · morning")).toBeInTheDocument();

    // Collapse the history again.
    await user.click(screen.getByRole("button", { name: "Hide location histories" }));
    expect(screen.queryByText("Arrival")).not.toBeInTheDocument();
  });
});

describe("LocationsPage — editing and deleting a location", () => {
  function singleCardProject() {
    const location = makeLocation({ name: "Carlton House", description: "A manor by the lake." });
    const project: WritingProject = {
      ...baseProject(),
      locations: [location],
    };
    return { project, location };
  }

  it("deletes the location when the confirmation is accepted", async () => {
    const user = userEvent.setup();
    const { project, location } = singleCardProject();
    confirmSpy.mockReturnValue(true);
    renderPage(project);

    await user.click(screen.getByRole("button", { name: "Delete Carlton House" }));

    expect(removeLocationMock).toHaveBeenCalledTimes(1);
    expect(removeLocationMock.mock.calls[0][0]).toBe(project.id);
    expect(removeLocationMock.mock.calls[0][1]).toBe(location.id);
  });

  it("does not delete the location when the confirmation is declined", async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValue(false);
    renderPage(singleCardProject().project);

    await user.click(screen.getByRole("button", { name: "Delete Carlton House" }));

    expect(removeLocationMock).not.toHaveBeenCalled();
  });

  it("saves an edited name and description with a trimmed name", async () => {
    const user = userEvent.setup();
    const { project, location } = singleCardProject();
    renderPage(project);

    await user.click(screen.getByRole("button", { name: "Edit Carlton House" }));
    const nameInput = screen.getByPlaceholderText("e.g. Carlton House");
    await user.clear(nameInput);
    await user.type(nameInput, "  New Manor  ");
    const descriptionInput = screen.getByPlaceholderText("What makes this place matter to the story?");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Renovated");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateLocationMock).toHaveBeenCalledTimes(1);
    expect(updateLocationMock.mock.calls[0][0]).toBe(project.id);
    expect(updateLocationMock.mock.calls[0][1]).toBe(location.id);
    expect(updateLocationMock.mock.calls[0][2]).toEqual({
      name: "New Manor",
      description: "Renovated",
    });
    expect(screen.queryByRole("heading", { name: "Edit location" })).not.toBeInTheDocument();
  });

  it("does not save an edit when the name is blank", async () => {
    const user = userEvent.setup();
    renderPage(singleCardProject().project);

    await user.click(screen.getByRole("button", { name: "Edit Carlton House" }));
    const nameInput = screen.getByPlaceholderText("e.g. Carlton House");
    await user.clear(nameInput);
    await user.type(nameInput, "   ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateLocationMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Edit location" })).toBeInTheDocument();

    // Closing afterwards via Cancel also works.
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Edit location" })).not.toBeInTheDocument();
  });

  it("cancels editing without saving", async () => {
    const user = userEvent.setup();
    renderPage(singleCardProject().project);

    await user.click(screen.getByRole("button", { name: "Edit Carlton House" }));
    await user.click(modalCloseButton("Edit location"));

    expect(updateLocationMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Edit location" })).not.toBeInTheDocument();
  });
});
