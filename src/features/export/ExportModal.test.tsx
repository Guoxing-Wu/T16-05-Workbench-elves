import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportModal } from "./ExportModal";
import { ExportError, exportStructureToExcel } from "../../lib/exportExcel";
import { useWorkbench } from "../../lib/store";
import { buildCustomStructure, buildProject } from "../../test/fixtures";
import type { WritingProject } from "../../lib/domain";

jest.mock("../../lib/store", () => ({ useWorkbench: jest.fn() }));
// Keep the real ExportError class, but never build a real workbook in a UI test.
jest.mock("../../lib/exportExcel", () => ({
  ...jest.requireActual<typeof import("../../lib/exportExcel")>("../../lib/exportExcel"),
  exportStructureToExcel: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const exportMock = jest.mocked(exportStructureToExcel);
const structures = [buildCustomStructure()];

function openProject(project: WritingProject | null) {
  storeMock.mockReturnValue({
    activeProject: project,
    customStoryStructures: structures,
  } as unknown as ReturnType<typeof useWorkbench>);
}

const downloadButton = () => screen.getByRole("button", { name: /Download Excel|Creating/ });

beforeEach(() => {
  exportMock.mockReset();
});

describe("ExportModal", () => {
  it("asks the user to open a project first, and disables the button", () => {
    openProject(null);
    render(<ExportModal onClose={jest.fn()} />);

    expect(screen.getByText(/Open a project first/)).toBeInTheDocument();
    expect(downloadButton()).toBeDisabled();
  });

  it("describes the project that will be exported", () => {
    openProject(buildProject());
    render(<ExportModal onClose={jest.fn()} />);

    expect(screen.getByText("Test Novel")).toBeInTheDocument();
    expect(screen.getByText(/6 chapters/)).toBeInTheDocument();
    expect(downloadButton()).toBeEnabled();
  });

  it("uses the singular for exactly one chapter", () => {
    openProject(buildProject({ chapters: buildProject().chapters.slice(0, 1) }));
    render(<ExportModal onClose={jest.fn()} />);
    expect(screen.getByText(/1 chapter\b/)).toBeInTheDocument();
    expect(screen.queryByText(/1 chapters/)).not.toBeInTheDocument();
  });

  it("exports the open project with the custom structures, then confirms the file name", async () => {
    const user = userEvent.setup();
    const project = buildProject();
    openProject(project);
    exportMock.mockResolvedValue("Test Novel - Story Structure - 2026-10-24.xlsx");
    render(<ExportModal onClose={jest.fn()} />);

    await user.click(downloadButton());

    expect(exportMock).toHaveBeenCalledWith(project, structures);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Downloaded Test Novel - Story Structure - 2026-10-24.xlsx"
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows 'Creating…' and disables the button while the file is being built", async () => {
    const user = userEvent.setup();
    openProject(buildProject());
    let finish!: (name: string) => void;
    exportMock.mockReturnValue(new Promise<string>((resolve) => (finish = resolve)));
    render(<ExportModal onClose={jest.fn()} />);

    await user.click(downloadButton());
    expect(screen.getByRole("button", { name: /Creating/ })).toBeDisabled();

    await act(async () => finish("done.xlsx"));
    expect(downloadButton()).toBeEnabled();
    expect(downloadButton()).toHaveTextContent("Download Excel (.xlsx)");
  });

  it("shows the friendly message from an ExportError", async () => {
    const user = userEvent.setup();
    openProject(buildProject());
    exportMock.mockRejectedValue(new ExportError("This project has no chapters yet."));
    render(<ExportModal onClose={jest.fn()} />);

    await user.click(downloadButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("This project has no chapters yet.");
    expect(downloadButton()).toBeEnabled(); // can try again
  });

  it("shows a generic message for unexpected errors (and hides the technical details)", async () => {
    const user = userEvent.setup();
    openProject(buildProject());
    exportMock.mockRejectedValue(new Error("Cannot read properties of undefined"));
    render(<ExportModal onClose={jest.fn()} />);

    await user.click(downloadButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The Excel file could not be created.");
    expect(alert).not.toHaveTextContent("Cannot read properties");
  });

  it("clears the previous message when exporting again", async () => {
    const user = userEvent.setup();
    openProject(buildProject());
    exportMock.mockRejectedValueOnce(new ExportError("First failure"));
    exportMock.mockResolvedValueOnce("ok.xlsx");
    render(<ExportModal onClose={jest.fn()} />);

    await user.click(downloadButton());
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(downloadButton());
    expect(await screen.findByRole("status")).toHaveTextContent("Downloaded ok.xlsx");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does nothing if there is no open project", async () => {
    openProject(null);
    render(<ExportModal onClose={jest.fn()} />);
    // The button is disabled, so a click must not trigger an export.
    await userEvent.setup().click(downloadButton());
    expect(exportMock).not.toHaveBeenCalled();
  });

  it("closes from the X button and from a click on the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    openProject(buildProject());
    const { container } = render(<ExportModal onClose={onClose} />);

    await user.click(container.querySelector(".icon-button")!);
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.pointer({ keys: "[MouseLeft]", target: container.querySelector(".modal-backdrop")! });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
