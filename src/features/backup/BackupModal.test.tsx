import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackupModal } from "./BackupModal";
import { createBackup, serializeBackup } from "../../lib/backup";
import { useWorkbench } from "../../lib/store";
import { buildCustomStructure, buildProject } from "../../test/fixtures";
import type { WritingProject } from "../../lib/domain";
import type { StoryStructureTemplate } from "../story-structure/storyStructureTemplate";

jest.mock("../../lib/store", () => ({ useWorkbench: jest.fn() }));

const storeMock = jest.mocked(useWorkbench);
const importBackup = jest.fn();
const exportBackup = jest.fn();

function setStore(projects: WritingProject[], customStoryStructures: StoryStructureTemplate[] = []) {
  storeMock.mockReturnValue({ projects, customStoryStructures, importBackup, exportBackup } as unknown as ReturnType<typeof useWorkbench>);
}

// A backup file as the user would pick it from disk.
function backupFile(projects: WritingProject[], structures: StoryStructureTemplate[] = []) {
  const text = serializeBackup(createBackup(projects, structures, new Date("2026-10-10T05:30:00.000Z")));
  return new File([text], "my-backup.json", { type: "application/json" });
}

// The hidden <input type="file"> behind "Choose backup file…".
const fileInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;

async function chooseFile(container: HTMLElement, file: File) {
  await userEvent.setup().upload(fileInput(container), file);
}

// Open the modal with the given current data, choose a backup file and wait for the preview.
async function stage(current: WritingProject[], incoming: WritingProject[], incomingStructures: StoryStructureTemplate[] = []) {
  setStore(current);
  const view = render(<BackupModal onClose={jest.fn()} />);
  await chooseFile(view.container, backupFile(incoming, incomingStructures));
  await screen.findByText("my-backup.json");
  return view;
}

const chooseReplace = () => userEvent.setup().click(screen.getByRole("radio", { name: /Replace everything/ }));
const clickButton = (name: string) => userEvent.setup().click(screen.getByRole("button", { name }));

beforeEach(() => {
  importBackup.mockReset();
  exportBackup.mockReset();
  // jsdom's File has no .text() in every version.
  if (!File.prototype.text) {
    File.prototype.text = function (this: Blob) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(this);
      });
    };
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("BackupModal: export", () => {
  it("disables the download button when there is nothing to back up", () => {
    setStore([]);
    render(<BackupModal onClose={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Download backup/ })).toBeDisabled();
  });

  it("downloads a backup and confirms how much was saved", async () => {
    setStore([buildProject(), buildProject({ id: "p2" })], [buildCustomStructure()]);
    render(<BackupModal onClose={jest.fn()} />);

    await clickButton("Download backup");

    expect(exportBackup).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Backup downloaded: 2 projects and 1 custom structure.");
  });
});

describe("BackupModal: choosing a file", () => {
  it("only accepts .json files", () => {
    setStore([]);
    const { container } = render(<BackupModal onClose={jest.fn()} />);
    expect(fileInput(container).accept).toBe("application/json,.json");
  });

  it("previews a valid backup without importing, and Cancel clears the preview", async () => {
    await stage([], [buildProject()], [buildCustomStructure()]);
    expect(screen.getByText(/Contains/)).toHaveTextContent("Contains 1 project and 1 custom structure.");
    expect(importBackup).not.toHaveBeenCalled();

    await clickButton("Cancel");
    expect(screen.queryByText("my-backup.json")).not.toBeInTheDocument();
    expect(importBackup).not.toHaveBeenCalled();
  });

  it("shows an error and offers no restore for files that are not valid backups", async () => {
    const bad: [string, RegExp][] = [
      ["this is not json", /not valid JSON/],
      [JSON.stringify({ hello: "world" }), /doesn't look like an Author's Workbench backup/],
      [JSON.stringify({ format: "authors-workbench-backup", version: 99, data: { projects: [] } }), /newer version of the app/],
    ];
    for (const [content, expected] of bad) {
      setStore([]);
      const { container, unmount } = render(<BackupModal onClose={jest.fn()} />);
      await chooseFile(container, new File([content], "bad.json", { type: "application/json" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(expected);
      expect(screen.queryByRole("button", { name: /restore$/i })).not.toBeInTheDocument();
      unmount();
    }
    expect(importBackup).not.toHaveBeenCalled();
  });
});

describe("BackupModal: merge", () => {
  it("is the default mode and says how many projects will be overwritten", async () => {
    await stage([buildProject()], [buildProject({ title: "From backup" }), buildProject({ id: "p2" })]);
    expect(screen.getByRole("radio", { name: /Merge with current data/ })).toBeChecked();
    expect(screen.getByText(/1 project with the same id will be overwritten/)).toBeInTheDocument();
  });

  it("restores with mode 'merge', without confirmation or a safety copy", async () => {
    const confirm = jest.spyOn(window, "confirm");
    await stage([buildProject({ id: "existing" })], [buildProject()], [buildCustomStructure()]);

    await clickButton("Merge & restore");

    expect(confirm).not.toHaveBeenCalled();
    expect(exportBackup).not.toHaveBeenCalled();
    const [backup, mode] = importBackup.mock.calls[0] as [ReturnType<typeof createBackup>, string];
    expect(mode).toBe("merge");
    expect(backup.data.projects.map((p) => p.id)).toEqual(["p1"]);
    expect(screen.getByRole("status")).toHaveTextContent("Merged 1 project and 1 custom structure into your workbench.");
  });
});

describe("BackupModal: replace", () => {
  it("warns how many current projects will be deleted, or that none will", async () => {
    const { unmount } = await stage([buildProject({ id: "x" }), buildProject({ id: "y" })], [buildProject({ id: "z" })]);
    await chooseReplace();
    expect(screen.getByText(/2 current projects not in the backup will be deleted/)).toBeInTheDocument();
    unmount();

    await stage([buildProject()], [buildProject()]);
    await chooseReplace();
    expect(screen.getByText(/No current project will be lost/)).toBeInTheDocument();
  });

  it("does nothing if the user declines the confirmation", async () => {
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
    await stage([buildProject({ id: "x" })], [buildProject()]);
    await chooseReplace();

    await clickButton("Replace & restore");

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("This cannot be undone"));
    expect(importBackup).not.toHaveBeenCalled();
    expect(exportBackup).not.toHaveBeenCalled();
    expect(screen.getByText("my-backup.json")).toBeInTheDocument(); // still staged
  });

  it("downloads a safety copy BEFORE replacing the data", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    await stage([buildProject({ id: "x" })], [buildProject()]);
    await chooseReplace();
    expect(screen.getByRole("checkbox", { name: /Download a backup of my current data first/ })).toBeChecked();

    await clickButton("Replace & restore");

    expect(importBackup.mock.calls[0][1]).toBe("replace");
    expect(exportBackup.mock.invocationCallOrder[0]).toBeLessThan(importBackup.mock.invocationCallOrder[0]);
    expect(screen.getByRole("status")).toHaveTextContent("Your previous data was replaced.");
  });

  it("skips the safety copy when unticked, and does not offer it when there is no current data", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const { unmount } = await stage([buildProject({ id: "x" })], [buildProject()]);
    await chooseReplace();
    await userEvent.setup().click(screen.getByRole("checkbox", { name: /Download a backup/ }));
    await clickButton("Replace & restore");
    expect(exportBackup).not.toHaveBeenCalled();
    expect(importBackup).toHaveBeenCalledTimes(1);
    unmount();

    await stage([], [buildProject()]);
    await chooseReplace();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("BackupModal: missing custom structures", () => {
  it("warns when a restored project uses a structure that will not exist", async () => {
    await stage([], [buildProject({ storyStructure: "custom-gone" })]);
    expect(screen.getByText(/use a custom story structure that is not available/)).toBeInTheDocument();
    expect(screen.getByText(/Three-Act structure instead/)).toBeInTheDocument();
  });

  it("does not warn when the structure is in the backup, but does in replace mode if only a local copy had it", async () => {
    const inBackup = await stage([], [buildProject({ storyStructure: "custom-1" })], [buildCustomStructure()]);
    expect(screen.queryByText(/not available/)).not.toBeInTheDocument();
    inBackup.unmount();

    setStore([], [buildCustomStructure()]); // exists locally only
    const { container } = render(<BackupModal onClose={jest.fn()} />);
    await chooseFile(container, backupFile([buildProject({ storyStructure: "custom-1" })], []));
    await screen.findByText("my-backup.json");
    expect(screen.queryByText(/not available/)).not.toBeInTheDocument(); // merge keeps the local structure

    await chooseReplace();
    await waitFor(() => expect(screen.getByText(/not available/)).toBeInTheDocument());
  });
});

describe("BackupModal: closing", () => {
  it("calls onClose from the X button", async () => {
    setStore([]);
    const onClose = jest.fn();
    const { container } = render(<BackupModal onClose={onClose} />);
    await userEvent.setup().click(container.querySelector(".icon-button")!);
    expect(onClose).toHaveBeenCalled();
  });
});