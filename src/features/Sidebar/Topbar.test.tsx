import { beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useWorkbench } from "../../lib/store";
import type { SaveStatus } from "../../lib/store";
import type { AuthorProfile } from "../../components/ProfilePage";
import { TopBar } from "./Topbar";

// Test the component with controlled store states.
jest.mock("../../lib/store", () => ({
    useWorkbench: jest.fn(),
}));

const storeMock = jest.mocked(useWorkbench);
const retrySaveMock = jest.fn<() => Promise<void>>();
const exportBackupMock = jest.fn<() => void>();

const TEST_PROFILE: AuthorProfile = {
    displayName: "Olivia Smith",
    penName: "Lyra Vance",
    bio: "",
    avatarUrl: null,
};

function setSaveStatus(saveStatus: SaveStatus) {
    // Supply the store fields used by TopBar.
    storeMock.mockReturnValue({
        activeProject: null,
        saveStatus,
        retrySave: retrySaveMock,
        exportBackup: exportBackupMock,
        setActiveView: jest.fn(),
    } as unknown as ReturnType<typeof useWorkbench>);
}

beforeEach(() => {
    storeMock.mockReset();

    retrySaveMock.mockReset();
    retrySaveMock.mockResolvedValue(undefined);

    exportBackupMock.mockReset();
});

describe("TopBar save status", () => {
    it.each<[SaveStatus, string, number]>([
        ["loading", "Loading…", 0],
        ["saving", "Saving…", 0],
        ["saved", "Saved locally", 0],
        ["error", "Save failed", 1],
    ])(
        "shows the correct indicator and recovery actions for %s",
        (status, label, recoveryCount) => {
            setSaveStatus(status);
            render(<TopBar profile={TEST_PROFILE} />);

            const indicator = screen.getByRole("status");

            expect(indicator).toHaveTextContent(label);
            expect(indicator).toHaveClass(
                `saved-badge--${status}`
            );

            expect(screen.queryAllByRole("alert")).toHaveLength(
                recoveryCount
            );

            expect(
                screen.queryAllByRole("button", {
                    name: "Retry",
                })
            ).toHaveLength(recoveryCount);

            expect(
                screen.queryAllByRole("button", {
                    name: "Export backup",
                })
            ).toHaveLength(recoveryCount);
        }
    );

    it("calls retrySave when Retry is clicked", async () => {
        const user = userEvent.setup();

        setSaveStatus("error");
        render(<TopBar profile={TEST_PROFILE} />);

        await user.click(
            screen.getByRole("button", {
                name: "Retry",
            })
        );

        expect(retrySaveMock).toHaveBeenCalledTimes(1);
        expect(exportBackupMock).not.toHaveBeenCalled();
    });

    it("calls exportBackup when Export backup is clicked", async () => {
        const user = userEvent.setup();

        setSaveStatus("error");
        render(<TopBar profile={TEST_PROFILE} />);

        await user.click(
            screen.getByRole("button", {
                name: "Export backup",
            })
        );

        expect(exportBackupMock).toHaveBeenCalledTimes(1);
        expect(retrySaveMock).not.toHaveBeenCalled();
    });

    it("removes the error banner when the store reports a successful save", () => {
        setSaveStatus("error");

        const { rerender } = render(
            <TopBar profile={TEST_PROFILE} />
        );

        expect(screen.getByRole("alert")).toBeInTheDocument();

        setSaveStatus("saved");
        rerender(<TopBar profile={TEST_PROFILE} />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Saved locally"
        );
        expect(
            screen.queryByRole("alert")
        ).not.toBeInTheDocument();
    });
});