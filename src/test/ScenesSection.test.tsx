import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ScenesSection } from "../features/event-and-scene/ScenesSection";
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

describe("ScenesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseWorkbench.mockReturnValue({
      addStoryScene: jest.fn(),
      updateStoryScene: jest.fn(),
      removeStoryScene: jest.fn(),
      addLocation: jest.fn(),
    } as unknown as ReturnType<typeof useWorkbench>);
  });

  // Shows an empty state when the project has no scenes.
  test("shows an empty state when there are no scenes", () => {
    render(<ScenesSection project={mockProject} />);

    expect(screen.getByText("Scenes")).toBeInTheDocument();

    expect(
      screen.getByText(
        /No scenes yet\. Create a scene to start planning/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 scenes in this project")
    ).toBeInTheDocument();
  });

  // Opens the scene creation modal.
  test("opens the create scene modal", async () => {
    const user = userEvent.setup();

    render(<ScenesSection project={mockProject} />);

    await user.click(
      screen.getByRole("button", { name: /add scene/i })
    );

    expect(
      screen.getByRole("heading", { name: "Create a scene" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /save scene/i })
    ).toBeInTheDocument();
  });

  // Requires a title, date, and at least one linked chapter.
  test("validates required fields when saving a scene", async () => {
    const user = userEvent.setup();

    render(<ScenesSection project={mockProject} />);

    await user.click(
      screen.getByRole("button", { name: /add scene/i })
    );

    await user.click(
      screen.getByRole("button", { name: /save scene/i })
    );

    expect(
      screen.getByText("Please enter a scene title.")
    ).toBeInTheDocument();

    expect(mockUseWorkbench().addStoryScene).not.toHaveBeenCalled();
  });

  // Saves a scene with its basic details.
  test("creates a scene with its basic details", async () => {
    const user = userEvent.setup();
    const addStoryScene = jest.fn();

    mockUseWorkbench.mockReturnValue({
      addStoryScene,
      updateStoryScene: jest.fn(),
      removeStoryScene: jest.fn(),
      addLocation: jest.fn(),
    } as unknown as ReturnType<typeof useWorkbench>);

    const project = {
      ...mockProject,
      chapters: [
        {
          id: "chapter-1",
          title: "Chapter One",
          order: 1,
        },
      ],
    } as unknown as WritingProject;

    render(<ScenesSection project={project} />);

    await user.click(
      screen.getByRole("button", { name: /add scene/i })
    );

    await user.type(
      screen.getByPlaceholderText("e.g. Emma enters the café"),
      "Emma enters the café"
    );

    await user.type(
      screen.getByLabelText("Date"),
      "2026-03-01"
    );

    await user.type(
      screen.getByPlaceholderText("What happens in this scene?"),
      "Emma arrives and looks around."
    );

    await user.click(
      screen.getByRole("button", { name: "Linked chapters" })
    );

    await user.click(
      screen.getByRole("button", { name: "Chapter One" })
    );

    await user.click(
      screen.getByRole("button", { name: /save scene/i })
    );

    expect(addStoryScene).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        title: "Emma enters the café",
        description: "Emma arrives and looks around.",
        date: {
          year: 2026,
          month: 3,
          day: 1,
        },
        chapterIds: ["chapter-1"],
        characterIds: [],
      })
    );
  });

  // Links selected chapters and characters to a scene.
  test("links selected chapters and characters to a scene", async () => {
    const user = userEvent.setup();
    const addStoryScene = jest.fn();

    mockUseWorkbench.mockReturnValue({
      addStoryScene,
      updateStoryScene: jest.fn(),
      removeStoryScene: jest.fn(),
      addLocation: jest.fn(),
    } as unknown as ReturnType<typeof useWorkbench>);

    const project = {
      ...mockProject,
      chapters: [
        {
          id: "chapter-1",
          title: "Chapter One",
          order: 1,
        },
      ],
      characters: [
        {
          id: "character-1",
          name: "Alex",
          firstName: "Alex",
          lastName: "",
        },
      ],
    } as unknown as WritingProject;

    render(<ScenesSection project={project} />);

    await user.click(
      screen.getByRole("button", { name: /add scene/i })
    );

    await user.type(
      screen.getByPlaceholderText("e.g. Emma enters the café"),
      "First Meeting"
    );

    await user.type(
      screen.getByLabelText("Date"),
      "2026-03-01"
    );

    await user.click(
      screen.getByRole("button", { name: "Linked chapters" })
    );

    await user.click(
      screen.getByRole("button", { name: "Chapter One" })
    );

    await user.click(
      screen.getByRole("button", { name: "Characters" })
    );

    await user.click(
      screen.getByRole("button", { name: "Alex" })
    );

    await user.click(
      screen.getByRole("button", { name: /save scene/i })
    );

    expect(addStoryScene).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        title: "First Meeting",
        chapterIds: ["chapter-1"],
        characterIds: ["character-1"],
      })
    );
  });
});

// Edit an existing scene
test("updates an existing scene", async () => {
  const user = userEvent.setup();
  const updateStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene: jest.fn(),
    updateStoryScene,
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
    scenes: [
      {
        id: "scene-1",
        title: "Original Scene",
        description: "Original description",
        date: { year: 2026, month: 3, day: 1 },
        chapterIds: ["chapter-1"],
        characterIds: [],
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: "Edit scene" })
  );

  expect(
    screen.getByRole("heading", { name: "Edit scene" })
  ).toBeInTheDocument();

  const titleInput = screen.getByPlaceholderText(
    "e.g. Emma enters the café"
  );

  await user.clear(titleInput);
  await user.type(titleInput, "Updated Scene");

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(updateStoryScene).toHaveBeenCalledWith(
    "project-1",
    "scene-1",
    expect.objectContaining({
      title: "Updated Scene",
      description: "Original description",
      chapterIds: ["chapter-1"],
      characterIds: [],
    })
  );
});

// Delete an existing scene
test("deletes a scene after confirmation", async () => {
  const user = userEvent.setup();
  const removeStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene: jest.fn(),
    updateStoryScene: jest.fn(),
    removeStoryScene,
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    scenes: [
      {
        id: "scene-1",
        title: "Scene to Delete",
        description: "This scene will be deleted.",
        date: { year: 2026, month: 3, day: 1 },
        chapterIds: [],
        characterIds: [],
      },
    ],
  } as unknown as WritingProject;

  const confirmSpy = jest
    .spyOn(window, "confirm")
    .mockReturnValue(true);

  try {
    render(<ScenesSection project={project} />);

    await user.click(
      screen.getByRole("button", { name: "Delete scene" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete the scene "Scene to Delete"?'
    );

    expect(removeStoryScene).toHaveBeenCalledWith(
      "project-1",
      "scene-1"
    );
  } finally {
    confirmSpy.mockRestore();
  }
});

// Links an existing location to a scene
test("links an existing location to a scene", async () => {
  const user = userEvent.setup();
  const addStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene,
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
    locations: [
      {
        id: "location-1",
        name: "Emma's Apartment",
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: /add scene/i })
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma enters the café"),
    "Emma arrives home"
  );

  await user.type(
    screen.getByLabelText("Date"),
    "2026-03-01"
  );

  await user.click(
    screen.getByRole("button", { name: "Linked chapters" })
  );

  await user.click(
    screen.getByRole("button", { name: "Chapter One" })
  );

  await user.click(
    screen.getByLabelText("Location (optional)")
  );

  await user.selectOptions(
    screen.getByLabelText("Location (optional)"),
    "location-1"
  );

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(addStoryScene).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({
      title: "Emma arrives home",
      chapterIds: ["chapter-1"],
      locationId: "location-1",
    })
  );
});

// Create a new location and links it to a scene
test("creates a new location and links it to a scene", async () => {
  const user = userEvent.setup();
  const addStoryScene = jest.fn();
  const addLocation = jest.fn().mockReturnValue({
    id: "location-2",
    name: "Emma's New Apartment",
  });

  mockUseWorkbench.mockReturnValue({
    addStoryScene,
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation,
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: /add scene/i })
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma enters the café"),
    "Emma moves into a new apartment"
  );

  await user.type(
    screen.getByLabelText("Date"),
    "2026-03-01"
  );

  await user.click(
    screen.getByRole("button", { name: "Linked chapters" })
  );

  await user.click(
    screen.getByRole("button", { name: "Chapter One" })
  );

  await user.selectOptions(
    screen.getByLabelText("Location (optional)"),
    "**new**"
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma's apartment"),
    "Emma's New Apartment"
  );

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(addLocation).toHaveBeenCalledWith(
    "project-1",
    { name: "Emma's New Apartment" }
  );

  expect(addStoryScene).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({
      title: "Emma moves into a new apartment",
      chapterIds: ["chapter-1"],
      locationId: "location-2",
    })
  );
});

// Validates a new location name before saving
test("validates a new location name before saving", async () => {
  const user = userEvent.setup();
  const addStoryScene = jest.fn();
  const addLocation = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene,
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation,
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: /add scene/i })
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma enters the café"),
    "Emma arrives home"
  );

  await user.type(
    screen.getByLabelText("Date"),
    "2026-03-01"
  );

  await user.click(
    screen.getByRole("button", { name: "Linked chapters" })
  );

  await user.click(
    screen.getByRole("button", { name: "Chapter One" })
  );

  await user.selectOptions(
    screen.getByLabelText("Location (optional)"),
    "**new**"
  );

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(
    screen.getByText("Please enter a location name.")
  ).toBeInTheDocument();

  expect(addLocation).not.toHaveBeenCalled();
  expect(addStoryScene).not.toHaveBeenCalled();
});

test("does not delete a scene when deletion is cancelled", async () => {
  const user = userEvent.setup();
  const removeStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene: jest.fn(),
    updateStoryScene: jest.fn(),
    removeStoryScene,
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    scenes: [
      {
        id: "scene-1",
        title: "Scene to Keep",
        description: "This scene should remain.",
        date: { year: 2026, month: 3, day: 1 },
        chapterIds: [],
        characterIds: [],
      },
    ],
  } as unknown as WritingProject;

  const confirmSpy = jest
    .spyOn(window, "confirm")
    .mockReturnValue(false);

  try {
    render(<ScenesSection project={project} />);

    await user.click(
      screen.getByRole("button", { name: "Delete scene" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete the scene "Scene to Keep"?'
    );

    expect(removeStoryScene).not.toHaveBeenCalled();
    expect(screen.getByText("Scene to Keep")).toBeInTheDocument();
  } finally {
    confirmSpy.mockRestore();
  }
});

test("displays scenes in chronological order", () => {
  mockUseWorkbench.mockReturnValue({
    addStoryScene: jest.fn(),
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    scenes: [
      {
        id: "scene-3",
        title: "March Scene",
        description: "A later scene.",
        date: { year: 2026, month: 3, day: 15 },
        chapterIds: [],
        characterIds: [],
      },
      {
        id: "scene-1",
        title: "January Scene",
        description: "The earliest scene.",
        date: { year: 2026, month: 1, day: 10 },
        chapterIds: [],
        characterIds: [],
      },
      {
        id: "scene-2",
        title: "February Scene",
        description: "The middle scene.",
        date: { year: 2026, month: 2, day: 20 },
        chapterIds: [],
        characterIds: [],
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  const titles = screen.getAllByText(
    /^(January|February|March) Scene$/
  );

  expect(titles.map((element) => element.textContent)).toEqual([
    "January Scene",
    "February Scene",
    "March Scene",
  ]);
});

test("saves the selected time for a scene", async () => {
  const user = userEvent.setup();
  const addStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene,
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: /add scene/i })
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma enters the café"),
    "Emma arrives"
  );

  await user.type(
    screen.getByLabelText("Date"),
    "2026-03-01"
  );

  await user.selectOptions(
    screen.getByLabelText("Time (optional)"),
    "14:30"
  );

  await user.click(
    screen.getByRole("button", { name: "Linked chapters" })
  );

  await user.click(
    screen.getByRole("button", { name: "Chapter One" })
  );

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(addStoryScene).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({
      title: "Emma arrives",
      date: { year: 2026, month: 3, day: 1 },
      time: "14:30",
      chapterIds: ["chapter-1"],
    })
  );
});

test("links an existing event to a scene", async () => {
  const user = userEvent.setup();
  const addStoryScene = jest.fn();

  mockUseWorkbench.mockReturnValue({
    addStoryScene,
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
    events: [
      {
        id: "event-1",
        title: "The First Meeting",
        startDate: { year: 2026, month: 3, day: 1 },
        endDate: { year: 2026, month: 3, day: 1 },
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  await user.click(
    screen.getByRole("button", { name: /add scene/i })
  );

  await user.type(
    screen.getByPlaceholderText("e.g. Emma enters the café"),
    "Emma meets Alex"
  );

  await user.type(
    screen.getByLabelText("Date"),
    "2026-03-01"
  );

  await user.selectOptions(
    screen.getByLabelText("Related event (optional)"),
    "event-1"
  );

  await user.click(
    screen.getByRole("button", { name: "Linked chapters" })
  );

  await user.click(
    screen.getByRole("button", { name: "Chapter One" })
  );

  await user.click(
    screen.getByRole("button", { name: /save scene/i })
  );

  expect(addStoryScene).toHaveBeenCalledWith(
    "project-1",
    expect.objectContaining({
      title: "Emma meets Alex",
      eventId: "event-1",
      chapterIds: ["chapter-1"],
    })
  );
});

test("displays characters linked to a scene", () => {
  mockUseWorkbench.mockReturnValue({
    addStoryScene: jest.fn(),
    updateStoryScene: jest.fn(),
    removeStoryScene: jest.fn(),
    addLocation: jest.fn(),
  } as unknown as ReturnType<typeof useWorkbench>);

  const project = {
    ...mockProject,
    chapters: [
      {
        id: "chapter-1",
        title: "Chapter One",
        order: 1,
      },
    ],
    characters: [
      {
        id: "character-1",
        name: "Alex",
        firstName: "Alex",
        lastName: "",
        birthday: { year: 2000, month: 1, day: 1 },
      },
    ],
    scenes: [
      {
        id: "scene-1",
        title: "Emma meets Alex",
        description: "They meet for the first time.",
        date: { year: 2026, month: 3, day: 1 },
        chapterIds: ["chapter-1"],
        characterIds: ["character-1"],
      },
    ],
  } as unknown as WritingProject;

  render(<ScenesSection project={project} />);

  expect(screen.getByText("Alex (26)")).toBeInTheDocument();
});