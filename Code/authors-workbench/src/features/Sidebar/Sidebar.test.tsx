import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createProject } from "../../lib/domain";
import type { WritingProject } from "../../lib/domain";
import { useWorkbench } from "../../lib/store";
import type { SaveStatus, WorkbenchView } from "../../lib/store";
import type { AuthorProfile } from "../../components/ProfilePage";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { TopBar } from "./Topbar";

// The three bars are tested on their own, so the store is replaced with a mock.
jest.mock("../../lib/store", () => ({
  useWorkbench: jest.fn(),
}));

// The Backup/Export modals only need to prove the tool buttons open them, so they
// are replaced with stubs that can also be "closed" by firing their onClose.
jest.mock("../backup/BackupModal", () => ({
  BackupModal: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      MockBackup
    </button>
  ),
}));
jest.mock("../export/ExportModal", () => ({
  ExportModal: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      MockExport
    </button>
  ),
}));

const storeMock = jest.mocked(useWorkbench);
const setActiveViewMock = jest.fn<(view: WorkbenchView) => void>();
const retrySaveMock = jest.fn<() => void>();
const exportBackupMock = jest.fn<() => void>();

// The bars read a small slice of the store. Every field is defaulted so a test
// can override just what it needs.
function mockStore(overrides: {
  activeProject?: WritingProject | null;
  activeView?: WorkbenchView;
  saveStatus?: SaveStatus;
}) {
  storeMock.mockReturnValue({
    activeProject: overrides.activeProject ?? null,
    activeView: overrides.activeView ?? "projects",
    saveStatus: overrides.saveStatus ?? "saved",
    setActiveView: setActiveViewMock,
    retrySave: retrySaveMock,
    exportBackup: exportBackupMock,
  } as unknown as ReturnType<typeof useWorkbench>);
}

beforeEach(() => {
  setActiveViewMock.mockClear();
  retrySaveMock.mockClear();
  exportBackupMock.mockClear();
});

describe("Sidebar", () => {
  it("renders every navigation group, the tools and the bottom help item", () => {
    mockStore({});
    render(<Sidebar />);

    // Top-level and manuscript groups.
    expect(screen.getByRole("button", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("MANUSCRIPT")).toBeInTheDocument();
    for (const label of ["Story Structure", "Chapter Plan", "Characters", "Locations", "Events", "Timeline"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    // Tools and bottom nav.
    expect(screen.getByText("TOOLS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Backup & Restore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("marks the current view with the active class", () => {
    mockStore({ activeView: "characters" });
    render(<Sidebar />);

    expect(screen.getByRole("button", { name: "Characters" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Projects" })).not.toHaveClass("active");
  });

  it("switches to the clicked view from a manuscript item and from the bottom nav", async () => {
    const user = userEvent.setup();
    mockStore({});
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Timeline" }));
    expect(setActiveViewMock).toHaveBeenLastCalledWith("timeline");

    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(setActiveViewMock).toHaveBeenLastCalledWith("help");
  });

  it("collapses and expands: hides labels and group titles, then restores them", async () => {
    const user = userEvent.setup();
    mockStore({});
    render(<Sidebar />);

    // Expanded: brand text and group titles are visible.
    expect(screen.getByText("AUTHOR'S")).toBeInTheDocument();
    expect(screen.getByText("MANUSCRIPT")).toBeInTheDocument();

    // Collapse.
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("AUTHOR'S")).not.toBeInTheDocument();
    expect(screen.queryByText("MANUSCRIPT")).not.toBeInTheDocument();
    expect(screen.queryByText("TOOLS")).not.toBeInTheDocument();
    // The collapse toggle switches to its expanded affordance.
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();

    // Expand again.
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByText("AUTHOR'S")).toBeInTheDocument();
    expect(screen.getByText("MANUSCRIPT")).toBeInTheDocument();
  });

  it("opens the backup modal from the Backup & Restore tool and closes it via its onClose", async () => {
    const user = userEvent.setup();
    mockStore({});
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Backup & Restore" }));
    expect(screen.getByRole("button", { name: "MockBackup" })).toBeInTheDocument();

    // The modal's onClose resets the open flag.
    await user.click(screen.getByRole("button", { name: "MockBackup" }));
    expect(screen.queryByRole("button", { name: "MockBackup" })).not.toBeInTheDocument();
  });

  it("opens the export modal from the Export tool and closes it via its onClose", async () => {
    const user = userEvent.setup();
    mockStore({});
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("button", { name: "MockExport" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "MockExport" }));
    expect(screen.queryByRole("button", { name: "MockExport" })).not.toBeInTheDocument();
  });
});

describe("RightSidebar — signature note", () => {
  it("renders the default signature and author", () => {
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    expect(
      screen.getByText("Stories are like secret drawers — full of things we forgot we knew.")
    ).toBeInTheDocument();
    expect(screen.getByText("— from Imbi's notebook")).toBeInTheDocument();
  });

  it("edits the signature on Enter and closes the textarea", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    await user.dblClick(screen.getByText("Stories are like secret drawers — full of things we forgot we knew."));
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "A new signature{Enter}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("A new signature")).toBeInTheDocument();
  });

  it("keeps editing when Shift+Enter is pressed and closes on blur", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    await user.dblClick(screen.getByText("Stories are like secret drawers — full of things we forgot we knew."));
    const textarea = screen.getByRole("textbox");
    // Shift+Enter should NOT close the edit.
    await user.type(textarea, "{Shift>}{Enter}{/Shift}");
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    // Losing focus closes it.
    await user.tab();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("edits the author on Enter", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    await user.dblClick(screen.getByText("— from Imbi's notebook"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "from my journal{Enter}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("— from my journal")).toBeInTheDocument();
  });

  it("closes the author edit when focus leaves the input", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    await user.dblClick(screen.getByText("— from Imbi's notebook"));
    await user.tab();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("— from Imbi's notebook")).toBeInTheDocument();
  });
});

describe("RightSidebar — recently edited", () => {
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  // A project whose children carry increasing editedAt timestamps so the sort,
  // the time labels and the top-four card can be checked deterministically.
  function recentProject() {
    const now = Date.now();
    const project = createProject({
      title: "Recent Novel",
      targetWordCount: 0,
      averageChapterLength: 0,
      storyStructure: "three-act",
    });
    project.chapters = [
      { id: "c1", order: 0, title: "First Chapter", targetWordCount: 0, actualWordCount: 0, notes: "", updatedAt: now - 10_000 },
    ];
    project.characters = [
      { id: "p1", name: "Ava", birthday: { year: 1990 }, updatedAt: now - 2 * 60_000 },
    ];
    project.locations = [
      { id: "l1", name: "Carlton", updatedAt: now - 3 * HOUR },
    ];
    project.events = [
      { id: "e1", title: "Arrival", description: "", startDate: { year: 1990 }, endDate: { year: 0 }, chapterIds: [], isStoryBeat: false, updatedAt: now - 1 * DAY },
      { id: "e2", title: "Old Event", description: "", startDate: { year: 1888 }, endDate: { year: 0 }, chapterIds: [], isStoryBeat: false, updatedAt: now - 10 * DAY },
    ];
    project.scenes = [
      { id: "s1", title: "Lobby", description: "", date: { year: 1990 }, chapterIds: [], updatedAt: now - 3 * DAY },
    ];
    return { project, now };
  }

  it("shows an empty prompt when no project is open", () => {
    mockStore({ activeProject: null });
    render(<RightSidebar />);

    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.getByText("Open a project to see recent edits.")).toBeInTheDocument();
  });

  it("shows the nothing-edited prompt when the project has no children", () => {
    mockStore({ activeProject: createProject({ title: "Empty", targetWordCount: 0, averageChapterLength: 0, storyStructure: "three-act" }) });
    render(<RightSidebar />);

    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.getByText("Nothing edited yet.")).toBeInTheDocument();
  });

  it("uses the fallback chapter title and the creation baseline for an item without a timestamp", () => {
    // A chapter with no title and no updatedAt falls back to its number and the
    // project's creation time — real data created before those fields existed.
    const project = createProject({ title: "Recent Novel", targetWordCount: 0, averageChapterLength: 0, storyStructure: "three-act" });
    project.chapters = [{ id: "c1", order: 0, title: "", targetWordCount: 0, actualWordCount: 0, notes: "" }];
    mockStore({ activeProject: project });
    render(<RightSidebar />);

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("lists the four most recently edited items with human-friendly times and navigates on click", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: recentProject().project });
    render(<RightSidebar />);

    // Top four by editedAt (most recent first).
    expect(screen.getByText("4 items")).toBeInTheDocument();
    expect(screen.getByText("First Chapter")).toBeInTheDocument();
    expect(screen.getByText("Ava")).toBeInTheDocument();
    expect(screen.getByText("Carlton")).toBeInTheDocument();
    expect(screen.getByText("Arrival")).toBeInTheDocument();
    // The two oldest stay out of the card.
    expect(screen.queryByText("Lobby")).not.toBeInTheDocument();
    expect(screen.queryByText("Old Event")).not.toBeInTheDocument();

    // Relative time labels.
    expect(screen.getByText("just now")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    expect(screen.getByText("yesterday")).toBeInTheDocument();

    // Clicking a card item opens its view.
    await user.click(screen.getByText("Ava"));
    expect(setActiveViewMock).toHaveBeenCalledWith("characters");
  });

  it("opens the view-all drawer with every item, navigates from it and closes it", async () => {
    const user = userEvent.setup();
    const { project, now } = recentProject();
    mockStore({ activeProject: project });
    render(<RightSidebar />);

    await user.click(screen.getByRole("button", { name: /View all/ }));
    const drawer = screen.getByRole("dialog", { name: "All recently edited" });
    const drawerScope = within(drawer);

    // All six items appear in the drawer, including the two oldest.
    expect(drawerScope.getByText("6 items")).toBeInTheDocument();
    expect(drawerScope.getByText("Lobby")).toBeInTheDocument();
    expect(drawerScope.getByText("Old Event")).toBeInTheDocument();
    expect(drawerScope.getByText("3 days ago")).toBeInTheDocument();
    expect(drawerScope.getByText(new Date(now - 10 * DAY).toLocaleDateString())).toBeInTheDocument();

    // Clicking an item navigates and closes the drawer.
    await user.click(drawerScope.getByText("Lobby"));
    expect(setActiveViewMock).toHaveBeenCalledWith("events");
    expect(screen.queryByRole("dialog", { name: "All recently edited" })).not.toBeInTheDocument();
  });

  it("closes the view-all drawer via its close button and via the scrim", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: recentProject().project });
    render(<RightSidebar />);

    // Close via the header close button.
    await user.click(screen.getByRole("button", { name: /View all/ }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "All recently edited" })).not.toBeInTheDocument();

    // Re-open and close via the scrim (mouse down on the backdrop).
    await user.click(screen.getByRole("button", { name: /View all/ }));
    const scrim = screen.getByRole("dialog", { name: "All recently edited" }).previousElementSibling as HTMLElement;
    await user.click(scrim);
    expect(screen.queryByRole("dialog", { name: "All recently edited" })).not.toBeInTheDocument();
  });
});

describe("TopBar", () => {
  function profile(overrides: Partial<AuthorProfile> = {}): AuthorProfile {
    return { displayName: "Imbi", penName: "Ink", bio: "", avatarUrl: null, ...overrides };
  }

  it("shows a default greeting and subtitle when no project is open", () => {
    mockStore({ activeProject: null });
    render(<TopBar profile={profile()} />);

    expect(screen.getByRole("heading", { name: "Hi, there!" })).toBeInTheDocument();
    expect(screen.getByText("Manage your writing projects and track your progress.")).toBeInTheDocument();
  });

  it("shows the open project's title and the writing prompt", () => {
    const project = createProject({ title: "My Novel", targetWordCount: 0, averageChapterLength: 0, storyStructure: "three-act" });
    mockStore({ activeProject: project });
    render(<TopBar profile={profile()} />);

    expect(screen.getByRole("heading", { name: "My Novel" })).toBeInTheDocument();
    expect(screen.getByText("Ready to write something wonderful today?")).toBeInTheDocument();
  });

  it.each<[SaveStatus, string]>([
    ["loading", "Loading…"],
    ["saving", "Saving…"],
    ["saved", "Saved locally"],
  ])("shows the %s save status badge", (status, label) => {
    mockStore({ activeProject: null, saveStatus: status });
    render(<TopBar profile={profile()} />);

    expect(screen.getByRole("status")).toHaveTextContent(label);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the avatar initial when there is no avatar image", () => {
    mockStore({ activeProject: null });
    render(<TopBar profile={profile({ displayName: "Imbi" })} />);

    expect(screen.getByRole("button", { name: "Open profile" })).toHaveTextContent("I");
  });

  it("shows the fallback initial 'A' when the display name is blank", () => {
    mockStore({ activeProject: null });
    render(<TopBar profile={profile({ displayName: "   " })} />);

    expect(screen.getByRole("button", { name: "Open profile" })).toHaveTextContent("A");
  });

  it("shows an avatar image when avatarUrl is set", () => {
    mockStore({ activeProject: null });
    render(<TopBar profile={profile({ avatarUrl: "https://example.com/avatar.png" })} />);

    const avatar = screen.getByRole("button", { name: "Open profile" });
    expect(avatar.querySelector("img")).toHaveAttribute("src", "https://example.com/avatar.png");
    expect(avatar.querySelector("span")).toBeNull();
  });

  it("opens the profile page from the avatar button", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null });
    render(<TopBar profile={profile()} />);

    await user.click(screen.getByRole("button", { name: "Open profile" }));
    expect(setActiveViewMock).toHaveBeenCalledWith("profile");
  });

  it("shows the error banner and triggers retry and export from it", async () => {
    const user = userEvent.setup();
    mockStore({ activeProject: null, saveStatus: "error" });
    render(<TopBar profile={profile()} />);

    // The badge switches to the failure label and the alert banner appears.
    expect(screen.getByRole("status")).toHaveTextContent("Save failed");
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Your latest changes haven't been saved.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retrySaveMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Export backup" }));
    expect(exportBackupMock).toHaveBeenCalledTimes(1);
  });
});
