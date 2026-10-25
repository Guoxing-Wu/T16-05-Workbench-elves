import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { EventsPage } from "../features/event-and-scene/EventsPage";
import { useWorkbench } from "../lib/store";
import type { WritingProject } from "../lib/domain";

jest.mock("../lib/store", () => ({
  useWorkbench: jest.fn(),
}));

const mockUseWorkbench = jest.mocked(useWorkbench);

const mockProject = {
  id: "project-1",
  title: "Test Project",
  targetWordCount: 50000,
  averageChapterLength: 2500,
  storyStructure: "save-the-cat",
  chapters: [],
  characters: [],
  locations: [],
  events: [],
  scenes: [],
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
} as unknown as WritingProject;

describe("EventsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseWorkbench.mockReturnValue({
      addStoryEvent: jest.fn(),
      updateStoryEvent: jest.fn(),
      removeStoryEvent: jest.fn(),
      addLocation: jest.fn(),
      customStoryStructures: [],
    } as unknown as ReturnType<typeof useWorkbench>);
  });

  // Initial state test
  test("shows an empty state when there are no events", () => {
    render(<EventsPage project={mockProject} />);

    expect(
      screen.getByText("No events yet.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 dated events and milestones")
    ).toBeInTheDocument();
  });

  // Test whether the initial page displays properly
  test("opens the create event form when Add event is clicked", async () => {
    const user = userEvent.setup();

    render(<EventsPage project={mockProject} />);

    await user.click(
      screen.getByRole("button", { name: /add event/i })
    );

    expect(
      screen.getByText("Create a story event or milestone")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Event title *")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Linked chapters")
    ).toBeInTheDocument();
  });
});

// Create and save the event
test("creates an event with the entered title and dates", async () => {
  const user = userEvent.setup();

  const addStoryEvent = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryEvent,
    updateStoryEvent: jest.fn(),
    removeStoryEvent: jest.fn(),
    addLocation: jest.fn(),
    customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);
  render(<EventsPage project={mockProject} />);

  // Open the create event form
  await user.click( screen.getByRole("button", { name: /add event/i }));

  // Enter the event title
  await user.type( screen.getByLabelText("Event title *"), "First Meeting");

  // Enter the start and end dates.
  await user.type(screen.getByLabelText("Start date *"), "2026-03-01");

  await user.type( screen.getByLabelText("End date *"), "2026-03-02");

  // Save the event.
  await user.click( screen.getByRole("button", { name: /save event/i }));
  // Verify that the store action was called for this project.
  expect(addStoryEvent).toHaveBeenCalledTimes(1);
  expect(addStoryEvent).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({
      title: "First Meeting",
      description: "",
      locationId: undefined,
      chapterIds: [],
      characterIds: [],
      isStoryBeat: false,
    })
  );

  // The create form should close after saving.
  expect(
    screen.queryByText("Create a story event or milestone")
  ).not.toBeInTheDocument();
});

// When required fileds are missing, can't create event
test("does not create an event when required fields are missing", async () => {
  const user = userEvent.setup();
  const addStoryEvent = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryEvent,
    updateStoryEvent: jest.fn(),
    removeStoryEvent: jest.fn(),
    addLocation: jest.fn(),
    customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);

  render(<EventsPage project={mockProject} />);

  // Open the create event form.
  await user.click( screen.getByRole("button", { name: /add event/i }) );

  // Enter a title and start date, but leave the end date empty.
  await user.type( screen.getByLabelText("Event title *"), "First Meeting" );

  await user.type(screen.getByLabelText("Start date *"), "2026-03-01");

  // Try to save without an end date.
  await user.click(screen.getByRole("button", { name: /save event/i }));

  // The event should not be created.
  expect(addStoryEvent).not.toHaveBeenCalled();

  // The form should remain open.
  expect( screen.getByText("Create a story event or milestone")).toBeInTheDocument();
});

// When the end date is earlier than the start date, prevent event creation
test("does not create an event when the end date is earlier than the start date", async () => {
  const user = userEvent.setup();
  const addStoryEvent = jest.fn();
  const alertSpy = jest
    .spyOn(window, "alert")
    .mockImplementation(() => {});

    mockUseWorkbench.mockReturnValue({
      addStoryEvent,
      updateStoryEvent: jest.fn(),
      removeStoryEvent: jest.fn(),
      addLocation: jest.fn(),
      customStoryStructures: [],
    } as unknown as ReturnType<typeof useWorkbench>);

    render(<EventsPage project={mockProject} />);

    // Open the create event form
    await user.click(screen.getByRole("button", {name: /add event/i}));

    // Enter a valid title but an invalid date range.
    await user.type(screen.getByLabelText("Event title *"), "First Meeting");

    await user.type(screen.getByLabelText("Start date *"), "2026-03-02");

    await user.type( screen.getByLabelText("End date *"), "2026-03-01");

    // Try to save the event.
  await user.click( screen.getByRole("button", { name: /save event/i }));

  // Verify the validation alert.
  expect(alertSpy).toHaveBeenCalledWith("End date cannot be earlier than start date.");

  // The event should not be created.
  expect(addStoryEvent).not.toHaveBeenCalled();

  // The form should remain open.
  expect(screen.getByText("Create a story event or milestone")).toBeInTheDocument();

  alertSpy.mockRestore();
});

// Edits an existing event
test("updates an existing event when edited", async () => {
  const user = userEvent.setup();
  const addStoryEvent = jest.fn();
  const updateStoryEvent = jest.fn();
  const event = {
    id: "event-1",
    title: "First Meeting",
    description: "An initial meeting",
    startDate: { year: 2026, month: 3, day: 1 },
    endDate: { year: 2026, month: 3, day: 2 },
    chapterIds: [],
    characterIds: [],
    isStoryBeat: false,
  };

  mockUseWorkbench.mockReturnValue({
    addStoryEvent, updateStoryEvent, removeStoryEvent: jest.fn(),
    addLocation: jest.fn(), customStoryStructures: [],
  }as unknown as ReturnType<typeof useWorkbench>);

  const project = { ...mockProject, events: [event] } as WritingProject;
  render(<EventsPage project={project} />);

  await user.click(screen.getByTitle("Edit event"));
  expect(screen.getByText("Edit story event")).toBeInTheDocument();
  expect(screen.getByLabelText("Event title *")).toHaveValue("First Meeting");

  const titleInput = screen.getByLabelText("Event title *");
  await user.clear(titleInput);
  await user.type(titleInput, "Updated Meeting");
  await user.click(screen.getByRole("button", { name: /save event/i }));

  expect(updateStoryEvent).toHaveBeenCalledTimes(1);
  expect(updateStoryEvent).toHaveBeenCalledWith(
    "project-1", "event-1",
    expect.objectContaining({ title: "Updated Meeting" })
  );
  expect(addStoryEvent).not.toHaveBeenCalled();
  expect(screen.queryByText("Edit story event")).not.toBeInTheDocument();
})

// Cancelling event editing should not save changes.
test("does not save changes when editing is cancelled", async () => {
  const user = userEvent.setup();
  const addStoryEvent = jest.fn();
  const updateStoryEvent = jest.fn();
  const event = {
    id: "event-1", title: "First Meeting", description: "An initial meeting",
    startDate: { year: 2026, month: 3, day: 1 },
    endDate: { year: 2026, month: 3, day: 2 },
    chapterIds: [], characterIds: [], isStoryBeat: false,
  };

  mockUseWorkbench.mockReturnValue({
    addStoryEvent, updateStoryEvent, removeStoryEvent: jest.fn(),
    addLocation: jest.fn(), customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);

  render(<EventsPage project={{ ...mockProject, events: [event] } as WritingProject} />);
  await user.click(screen.getByTitle("Edit event"));

  const titleInput = screen.getByLabelText("Event title *");
  await user.clear(titleInput);
  await user.type(titleInput, "Updated Meeting");
  await user.click(screen.getByRole("button", { name: /cancel/i }));

  expect(updateStoryEvent).not.toHaveBeenCalled();
  expect(addStoryEvent).not.toHaveBeenCalled();
  expect(screen.queryByText("Edit story event")).not.toBeInTheDocument();
  expect(screen.getByText("First Meeting")).toBeInTheDocument();
});

// Deletes an existing event.
test("deletes an existing event", async () => {
  const user = userEvent.setup();
  const removeStoryEvent = jest.fn();
  const event = {
    id: "event-1", title: "First Meeting", description: "An initial meeting",
    startDate: { year: 2026, month: 3, day: 1 },
    endDate: { year: 2026, month: 3, day: 2 },
    chapterIds: [], characterIds: [], isStoryBeat: false,
  };

  mockUseWorkbench.mockReturnValue({
    addStoryEvent: jest.fn(), updateStoryEvent: jest.fn(), removeStoryEvent,
    addLocation: jest.fn(), customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);

  render(<EventsPage project={{ ...mockProject, events: [event] } as WritingProject} />);
  await user.click(screen.getByTitle("Delete event"));

  expect(removeStoryEvent).toHaveBeenCalledTimes(1);
  expect(removeStoryEvent).toHaveBeenCalledWith("project-1", "event-1");
  expect(screen.getByText("First Meeting")).toBeInTheDocument();
});

// Creates a new location and links it to the event.
test("creates a new location and links it to the event", async () => {
  const user = userEvent.setup();
  const addStoryEvent = jest.fn();
  const addLocation = jest.fn().mockReturnValue({ id: "location-1", name: "Melbourne" });

  mockUseWorkbench.mockReturnValue({
    addStoryEvent, updateStoryEvent: jest.fn(), removeStoryEvent: jest.fn(),
    addLocation, customStoryStructures: [],
  } as unknown as ReturnType<typeof useWorkbench>);

  render(<EventsPage project={mockProject} />);
  await user.click(screen.getByRole("button", { name: /add event/i }));

  await user.type(screen.getByLabelText("Event title *"), "First Meeting");
  await user.type(screen.getByLabelText("Start date *"), "2026-03-01");
  await user.type(screen.getByLabelText("End date *"), "2026-03-02");

  await user.selectOptions(screen.getByLabelText("Location"), "**new**");
  await user.type(screen.getByPlaceholderText("New location name"), "Melbourne");
  await user.click(screen.getByRole("button", { name: /save event/i }));

  expect(addLocation).toHaveBeenCalledTimes(1);
  expect(addLocation).toHaveBeenCalledWith("project-1", { name: "Melbourne" });
  expect(addStoryEvent).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({ title: "First Meeting", locationId: "location-1" })
  );
});